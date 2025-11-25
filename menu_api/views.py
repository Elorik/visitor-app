from rest_framework import viewsets, generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Dish, Order, Review
from .serializers import (
    DishListSerializer, DishDetailSerializer, OrderSerializer,
    ReviewSerializer, RegisterSerializer, UserSerializer
)

class DishViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Dish.objects.filter(is_available=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return DishListSerializer
        return DishDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        category_name = self.request.query_params.get('category')
        max_price = self.request.query_params.get('max_price')
        tags_str = self.request.query_params.get('tags')

        if category_name:
            queryset = queryset.filter(category__name__iexact=category_name)

        if max_price:
            try:
                max_price = float(max_price)
                queryset = queryset.filter(price__lte=max_price)
            except ValueError:
                pass

        if tags_str:
            tags_list = [tag.strip().upper() for tag in tags_str.split(',')]
            queryset = queryset.filter(tags__in=tags_list)

        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderStatusUpdateAPIView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')

        if not new_status or new_status not in dict(Order.STATUS_CHOICES).keys():
            return Response(
                {"error": "Необхідно надати коректний статус."},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.status = new_status
        instance.save(update_fields=['status'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ReviewCreateAPIView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        dish_id = self.request.data.get('dish')
        user = self.request.user
        has_completed_order = Order.objects.filter(
            user=user,
            status='COMPLETED',
            items__dish_id=dish_id
        ).exists()

        if not has_completed_order:
            raise serializers.ValidationError(
                {
                    "detail": "Ви можете залишити відгук лише на страву, яку замовляли, і ваше замовлення має бути завершено."}
            )
        if Review.objects.filter(user=user, dish_id=dish_id).exists():
            raise serializers.ValidationError(
                {"detail": "Ви вже залишили відгук на цю страву."}
            )
        serializer.save(user=user)


class RegisterAPIView(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "Користувач успішно зареєстрований."
        })
