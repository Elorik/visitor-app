from django.contrib import admin
from .models import Category, Dish, Order, OrderItem, Review

admin.site.register(Category)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1

    fields = ('dish', 'quantity', 'price')
    readonly_fields = ('price',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'date', 'sums', 'is_admin_user')
    list_filter = ('status', 'date')
    search_fields = ('user__username', 'id')
    readonly_fields = ('date', 'sums')
    inlines = [OrderItemInline]

    def is_admin_user(self, obj):
        return obj.user.is_staff if obj.user else False

    is_admin_user.boolean = True
    is_admin_user.short_description = 'Адмін'


@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'rating', 'is_available', 'tags')
    list_filter = ('category', 'is_available', 'tags')
    search_fields = ('name', 'description')
    list_editable = ('price', 'is_available')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('dish', 'user', 'rating', 'date', 'comment_snippet')
    list_filter = ('rating', 'date')
    search_fields = ('dish__name', 'user__username', 'comment')

    def comment_snippet(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment

    comment_snippet.short_description = 'Коментар'
