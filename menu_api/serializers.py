from rest_framework import serializers
from .models import Category, Dish, Order, OrderItem, Review
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password'],
        )
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'dish', 'user', 'rating', 'comment', 'date')
        read_only_fields = ('user', 'date')


class DishListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = serializers.CharField(source='get_tags_display', read_only=True)

    class Meta:
        model = Dish
        fields = (
            'id',
            'name',
            'price',
            'category',
            'rating',
            'is_available',
            'photo',
            'tags',
        )


class DishDetailSerializer(DishListSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)
    description = serializers.CharField()

    class Meta(DishListSerializer.Meta):
        fields = DishListSerializer.Meta.fields + ('description', 'reviews')


class OrderItemSerializer(serializers.ModelSerializer):
    dish_name = serializers.CharField(source='dish.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('dish', 'quantity', 'price', 'dish_name')
        read_only_fields = ('price',)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user_info = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'user', 'user_info', 'date', 'sums', 'status', 'items')
        # user і sums виставляємо самі, status бере дефолт із моделі
        read_only_fields = ('user', 'sums', 'status')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user

        # створюємо замовлення без суми
        order = Order.objects.create(user=user, **validated_data)

        total_sum = 0
        for item_data in items_data:
            dish = item_data['dish']
            quantity = item_data['quantity']
            price = dish.price

            OrderItem.objects.create(
                order=order,
                dish=dish,
                quantity=quantity,
                price=price,
            )
            total_sum += price * quantity

        order.sums = total_sum
        order.save()

        return order
