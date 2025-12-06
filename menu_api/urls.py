from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DishViewSet,
    OrderViewSet,
    ReviewCreateAPIView,
    OrderStatusUpdateAPIView,
    RegisterAPIView,
    LoginAPIView,
    DishReviewsListAPIView,     # ← додано
)

router = DefaultRouter()
router.register(r"dishes", DishViewSet, basename="dish")
router.register(r"orders", OrderViewSet, basename="order")

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("orders/<int:pk>/status/", OrderStatusUpdateAPIView.as_view(), name="order-status-update"),
    path("reviews/", ReviewCreateAPIView.as_view(), name="review-create"),

    # ← новий ендпоінт для GET /api/dishes/<id>/reviews/
    path(
        "dishes/<int:dish_id>/reviews/",
        DishReviewsListAPIView.as_view(),
        name="dish-reviews"
    ),
]

urlpatterns += router.urls
