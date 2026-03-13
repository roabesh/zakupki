from django.urls import path
from .views import BasketView, OrderView, OrderDetailView, AdminOrderView

urlpatterns = [
    path('basket/', BasketView.as_view(), name='basket'),
    path('orders/', OrderView.as_view(), name='orders'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('admin/orders/', AdminOrderView.as_view(), name='admin-orders'),
    path('admin/order/', AdminOrderView.as_view(), name='admin-order'),
]
