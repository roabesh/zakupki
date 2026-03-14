from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers as drf_serializers

from apps.orders.models import Contact
from apps.orders.serializers import ContactSerializer
from .models import User
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserDetailsSerializer


class RegisterView(APIView):
    """Регистрация нового пользователя."""

    permission_classes = [AllowAny]

    @extend_schema(
        request=UserRegistrationSerializer,
        responses={
            201: inline_serializer('RegisterResponse', fields={
                'status': drf_serializers.CharField(),
                'token': drf_serializers.CharField(),
            }),
            400: OpenApiResponse(description='Ошибки валидации'),
        },
        summary='Регистрация',
        tags=['Пользователь'],
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            # Отправляем приветственный email: Celery или синхронно
            try:
                from tasks.email_tasks import send_registration_email_task
                send_registration_email_task.delay(user.id)
            except Exception:
                from tasks.email_tasks import _send_registration_email
                _send_registration_email(user)
            return Response(
                {'status': 'ok', 'token': token.key},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Авторизация. Возвращает токен."""

    permission_classes = [AllowAny]

    @extend_schema(
        request=UserLoginSerializer,
        responses={
            200: inline_serializer('LoginResponse', fields={
                'token': drf_serializers.CharField(),
            }),
            400: OpenApiResponse(description='Неверный email или пароль'),
        },
        summary='Авторизация',
        tags=['Пользователь'],
    )
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailsView(APIView):
    """Просмотр и обновление профиля пользователя."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: UserDetailsSerializer},
        summary='Получить профиль',
        tags=['Пользователь'],
    )
    def get(self, request):
        serializer = UserDetailsSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        request=UserDetailsSerializer,
        responses={200: UserDetailsSerializer, 400: OpenApiResponse(description='Ошибки валидации')},
        summary='Обновить профиль',
        tags=['Пользователь'],
    )
    def put(self, request):
        serializer = UserDetailsSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactView(APIView):
    """Управление контактами пользователя (телефон и адреса доставки)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ContactSerializer(many=True)},
        summary='Список контактов',
        tags=['Контакты'],
    )
    def get(self, request):
        contacts = Contact.objects.filter(user=request.user)
        serializer = ContactSerializer(contacts, many=True, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        request=ContactSerializer,
        responses={201: ContactSerializer, 400: OpenApiResponse(description='Ошибки валидации')},
        summary='Создать контакт',
        tags=['Контакты'],
    )
    def post(self, request):
        serializer = ContactSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        request=ContactSerializer,
        responses={200: ContactSerializer, 404: OpenApiResponse(description='Контакт не найден')},
        summary='Обновить контакт',
        tags=['Контакты'],
    )
    def put(self, request):
        contact_id = request.data.get('id')
        contact = get_object_or_404(Contact, id=contact_id, user=request.user)

        serializer = ContactSerializer(contact, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        request=inline_serializer('DeleteContactRequest', fields={
            'items': drf_serializers.ListField(child=drf_serializers.IntegerField()),
        }),
        responses={200: OpenApiResponse(description='Контакты удалены')},
        summary='Удалить контакты',
        tags=['Контакты'],
    )
    def delete(self, request):
        contact_ids = request.data.get('items', [])
        if not contact_ids:
            return Response({'error': 'Укажите список id контактов'}, status=status.HTTP_400_BAD_REQUEST)
        Contact.objects.filter(id__in=contact_ids, user=request.user).delete()
        return Response({'status': 'ok'})
