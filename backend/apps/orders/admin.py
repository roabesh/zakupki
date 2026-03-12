from django.contrib import admin
from django.utils.html import format_html
from .models import Contact, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Позиции заказа в виде inline-таблицы."""

    model = OrderItem
    extra = 0
    readonly_fields = ('product_info', 'shop_name', 'price', 'quantity', 'item_total')
    fields = ('product_info', 'shop_name', 'price', 'quantity', 'item_total')

    @admin.display(description='Магазин')
    def shop_name(self, obj):
        return obj.product_info.shop.name

    @admin.display(description='Цена')
    def price(self, obj):
        return f'{obj.product_info.price} ₽'

    @admin.display(description='Сумма')
    def item_total(self, obj):
        return f'{obj.product_info.price * obj.quantity} ₽'


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'phone', 'city', 'street', 'house')
    list_filter = ('type',)
    search_fields = ('user__email', 'phone', 'city')


def _make_state_action(state_value, state_label):
    """Фабрика для создания action смены статуса заказа."""

    def action(modeladmin, request, queryset):
        for order in queryset.exclude(state=Order.OrderState.BASKET):
            order.state = state_value
            order.save(update_fields=['state'])
            # Уведомляем покупателя асинхронно
            from tasks.email_tasks import send_status_notification_task
            send_status_notification_task.delay(order.id)
        modeladmin.message_user(
            request,
            f'Статус изменён на «{state_label}» для {queryset.count()} заказов.',
        )

    action.short_description = f'Установить статус: {state_label}'
    action.__name__ = f'set_state_{state_value}'
    return action


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'state_badge', 'created_at', 'items_count', 'order_total')
    list_filter = ('state', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'order_total', 'user')
    inlines = [OrderItemInline]
    date_hierarchy = 'created_at'

    # Генерируем actions для каждого статуса (кроме basket)
    actions = [
        _make_state_action(Order.OrderState.CONFIRMED, 'Подтверждён'),
        _make_state_action(Order.OrderState.ASSEMBLED, 'Собран'),
        _make_state_action(Order.OrderState.SENT, 'Отправлен'),
        _make_state_action(Order.OrderState.DELIVERED, 'Доставлен'),
        _make_state_action(Order.OrderState.CANCELLED, 'Отменён'),
    ]

    def get_queryset(self, request):
        """Скрываем корзины из списка заказов."""
        return (
            super().get_queryset(request)
            .exclude(state=Order.OrderState.BASKET)
            .select_related('user')
            .prefetch_related('order_items__product_info')
        )

    @admin.display(description='Покупатель', ordering='user__email')
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description='Статус')
    def state_badge(self, obj):
        """Цветовая индикация статуса заказа."""
        colours = {
            'new': '#17a2b8',
            'confirmed': '#007bff',
            'assembled': '#6610f2',
            'sent': '#fd7e14',
            'delivered': '#28a745',
            'cancelled': '#dc3545',
        }
        colour = colours.get(obj.state, '#6c757d')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            colour,
            obj.get_state_display(),
        )

    @admin.display(description='Позиций')
    def items_count(self, obj):
        return obj.order_items.count()

    @admin.display(description='Итого')
    def order_total(self, obj):
        return f'{obj.total_sum} ₽'

    # Явно регистрируем имена actions (Django требует)
    set_state_confirmed = actions[0]
    set_state_assembled = actions[1]
    set_state_sent = actions[2]
    set_state_delivered = actions[3]
    set_state_cancelled = actions[4]
