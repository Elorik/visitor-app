from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Назва категорії')

    class Meta:
        verbose_name = "Категорія"
        verbose_name_plural = "Категорії"

    def __str__(self):
        return self.name


class Dish(models.Model):
    TAG_CHOICES = (
        ('SPICY', 'Гостре'),
        ('SWEET', 'Солодке'),
        ('VEGAN', 'Вегетаріанське'),
        ('MEAT', 'Мясне'),
    )

    name = models.CharField(max_length=255, unique=True, verbose_name='Назва страви')
    description = models.TextField(verbose_name='Опис')
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="Ціна")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='dishes', verbose_name="Категорія")
    photo = models.ImageField(upload_to='dishes_photos/', blank=True, null=True, verbose_name="Фото")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(5)], verbose_name='Рейтинг')
    is_available = models.BooleanField(default=True, verbose_name="Наявність")
    tags = models.CharField(max_length=20, choices=TAG_CHOICES, blank=True, null=True, verbose_name="Теги")

    class Meta:
        verbose_name = "Страва"
        verbose_name_plural = "Страви"

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = (
        ('NEW', 'Новий'),
        ('IN_PROGRESS', 'В роботі'),
        ('COMPLETED', 'Готово'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='orders', verbose_name="Користувач")
    date = models.DateTimeField(auto_now_add=True, verbose_name="Дата замовлення")
    sums = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Загальна сума")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW', verbose_name="Статус")

    class Meta:
        verbose_name = "Замовлення"
        verbose_name_plural = "Замовлення"
        ordering = ['-date']

    def __str__(self):
        return f"Замовлення #{self.id} від {self.user.username if self.user else 'Гість'}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="Замовлення")
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, verbose_name="Страва")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)], verbose_name="Кількість")
    price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Ціна на момент замовлення")

    class Meta:
        verbose_name = "Деталь замовлення"
        verbose_name_plural = "Деталі замовлень"
        unique_together = ('order', 'dish')

    def __str__(self):
        return f"{self.dish.name} ({self.quantity} шт.) у замовленні #{self.order.id}"


class Review(models.Model):
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='reviews', verbose_name="Страва")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', verbose_name="Користувач")

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Оцінка"
    )

    comment = models.TextField(blank=True, null=True, verbose_name="Коментар")
    date = models.DateTimeField(auto_now_add=True, verbose_name="Дата відгуку")

    class Meta:
        verbose_name = "Відгук"
        verbose_name_plural = "Відгуки"
        unique_together = ('dish', 'user')

    def __str__(self):
        return f"Відгук {self.user.username} на {self.dish.name} ({self.rating}/5)"

