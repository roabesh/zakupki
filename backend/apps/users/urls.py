from django.urls import path, include
from .views import RegisterView, LoginView, UserDetailsView, ContactView

urlpatterns = [
    path('user/register/', RegisterView.as_view(), name='user-register'),
    path('user/login/', LoginView.as_view(), name='user-login'),
    path('user/details/', UserDetailsView.as_view(), name='user-details'),
    path('user/contact/', ContactView.as_view(), name='user-contact'),
    # Сброс пароля через django-rest-passwordreset
    path('user/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
]
