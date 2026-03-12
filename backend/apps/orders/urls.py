from django.urls import path
from .views import BasketView, OrderView, AdminOrderView

urlpatterns = [
    path('basket/', BasketView.as_view(), name='basket'),
    path('orders/', OrderView.as_view(), name='orders'),
    path('admin/orders/', AdminOrderView.as_view(), name='admin-orders'),
    path('admin/order/', AdminOrderView.as_view(), name='admin-order'),
]
