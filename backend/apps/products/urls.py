from django.urls import path
from .views import CategoryListView, ProductListView

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='categories'),
    path('products/', ProductListView.as_view(), name='products'),
]
