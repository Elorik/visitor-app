from django.urls import path
from rest_framework import generics
from rest_framework.routers import DefaultRouter
from .views import (
    DishViewSet, OrderViewSet, ReviewCreateAPIView,
    OrderStatusUpdateAPIView, RegisterAPIView
)

router = DefaultRouter()
router.register(r'dishes', DishViewSet, basename='dish')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', generics.GenericAPIView.as_view(), name='login'),
    path('orders/<int:pk>/status/', OrderStatusUpdateAPIView.as_view(), name='order-status-update'),
    path('reviews/', ReviewCreateAPIView.as_view(), name='review-create')
]

urlpatterns += router.urls
