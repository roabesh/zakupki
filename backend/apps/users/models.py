from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class UserType(models.TextChoices):
        BUYER = 'buyer', 'Покупатель'
        SUPPLIER = 'supplier', 'Поставщик'

    email = models.EmailField(unique=True, verbose_name='Email')
    first_name = models.CharField(max_length=50, blank=True, verbose_name='Имя')
    last_name = models.CharField(max_length=50, blank=True, verbose_name='Фамилия')
    company = models.CharField(max_length=100, blank=True, verbose_name='Компания')
    position = models.CharField(max_length=100, blank=True, verbose_name='Должность')
    type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.BUYER,
        verbose_name='Тип пользователя',
    )
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    is_staff = models.BooleanField(default=False, verbose_name='Персонал')

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.email
