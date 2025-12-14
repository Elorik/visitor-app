from rest_framework.authtoken.models import Token
from .models import Dish, Order, OrderItem, Review, Category
from rest_framework import viewsets, generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .serializers import (
    DishListSerializer, DishDetailSerializer, OrderSerializer,
    ReviewSerializer, RegisterSerializer, UserSerializer
)
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User



class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.filter(is_available=True)
    permission_classes = [permissions.AllowAny]

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

    def perform_create(self, serializer):
        category_name = self.request.data.get("category")
        if category_name:
            cat_obj, _ = Category.objects.get_or_create(name=category_name)
            serializer.save(category=cat_obj)
        else:
            serializer.save()

    def perform_update(self, serializer):
        category_name = self.request.data.get("category")
        if category_name:
            cat_obj, _ = Category.objects.get_or_create(name=category_name)
            serializer.save(category=cat_obj)
        else:
            serializer.save()



class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    # 👇 2. Розумна фільтрація
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Order.objects.none()

        if user.is_staff:
            return Order.objects.all().order_by('-date')

        return Order.objects.filter(user=user).order_by('-date')


class OrderStatusUpdateAPIView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')

        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]

        if not new_status or new_status not in valid_statuses:
            return Response(
                {"error": f"Некоректний статус. Доступні: {valid_statuses}"},
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
                    "detail": "Ви можете залишити відгук лише на страву, яку замовляли, і ваше замовлення має бути завершено."
                }
            )
        if Review.objects.filter(user=user, dish_id=dish_id).exists():
            raise serializers.ValidationError(
                {"detail": "Ви вже залишили відгук на цю страву."}
            )
        serializer.save(user=user)


class RegisterAPIView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
        })


class LoginAPIView(ObtainAuthToken):
    """
    POST /api/login/
    body: { "username": "...", "password": "..." }
    return: { "token": "...", "user": { ... } }
    """
    def post(self, request, *args, **kwargs):
        # стандартна перевірка логіну/пароля
        response = super().post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data["token"])
        user = token.user

        return Response({
            "token": token.key,
            "user": UserSerializer(user).data,
            "is_staff": user.is_staff
        })

class DishReviewsListAPIView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        dish_id = self.kwargs['dish_id']
        return Review.objects.filter(dish_id=dish_id).order_by('-date')
