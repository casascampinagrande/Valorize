from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Corretor, Anuncio
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator


class RegistroCorretorSerializer(serializers.ModelSerializer):

    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    class Meta:
        model = Corretor
        fields = [
            'nome',
            'email',
            'senha',
            'creci',
            'telefone',
            'cpf_cnpj'
        ]

        extra_kwargs = {
            'creci': {'required': False, 'allow_blank': True},
            'telefone': {'required': False, 'allow_blank': True}
        }

    def validate_email(self, value):

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")

        return value

    def create(self, validated_data):

        email = validated_data.pop('email')
        senha = validated_data.pop('senha')

        user = User.objects.create_user(
            username=email,
            email=email,
            password=senha,
            is_active=False
        )

        corretor = Corretor.objects.create(user=user, **validated_data)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        link = f"http://127.0.0.1:8000/confirmar/{uid}/{token}/"

        send_mail(
            'Confirme sua conta na Valorize',
            f'Olá {corretor.nome}, clique no link para ativar sua conta: {link}',
            'noreply@valorize.com',
            [email],
            fail_silently=False,
        )

        return corretor


class UserSerializer(serializers.ModelSerializer):

    nome = serializers.CharField(source='corretor.nome', required=False)

    foto = serializers.SerializerMethodField()

    location = serializers.SerializerMethodField()

    anuncios = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'nome',
            'foto',
            'location',
            'anuncios'
        ]

    def get_foto(self, obj):
        request = self.context.get('request')

        corretor = getattr(obj, 'corretor', None)

        if corretor and corretor.foto:
            return request.build_absolute_uri(corretor.foto.url)

        return None

    def get_location(self, obj):
        return "Paraíba, Brasil"

    def get_anuncios(self, obj):

        anuncios = Anuncio.objects.filter(corretor=obj)

        request = self.context.get('request')

        return [
            {
                "id": a.id,
                "title": a.titulo,
                "price": f"R$ {a.preco}",
                "city": a.cidade,
                "image": request.build_absolute_uri(a.imagem_capa.url) if a.imagem_capa else None
            }
            for a in anuncios
        ]

    def update(self, instance, validated_data):

        request = self.context.get('request')
        corretor = instance.corretor

        nome = request.data.get('nome')
        if nome:
            corretor.nome = nome

        if request.FILES.get('foto'):
            corretor.foto = request.FILES['foto']

        corretor.save()

        return instance


class AnuncioSerializer(serializers.ModelSerializer):
    
    images = serializers.SerializerMethodField()

    class Meta:
        model = Anuncio

        fields = [
            'id',
            'titulo',
            'descricao',
            'preco',
            'cidade',
            'bairro',
            'quartos',
            'banheiros',
            'vagas_garagem',
            'area_m2',
            'finalidade',
            'imagem_capa',
            'images',
            'data_criacao'
        ]

    def get_images(self, obj):
        request = self.context.get("request")
        return [
            request.build_absolute_uri(img.imagem.url)
            for img in obj.imagens.all()
        ]
    read_only_fields = [
        'id',
        'data_criacao'
    ]

    def validate(self, data):

        user = self.context['request'].user
        corretor = user.corretor

        anuncios_ativos = Anuncio.objects.filter(corretor=user).count()

        if not self.instance and anuncios_ativos >= corretor.limite_anuncios:

            raise serializers.ValidationError(
                f"Seu plano permite apenas {corretor.limite_anuncios} anúncios."
            )

        return data


    def get_images(self, obj):

        request = self.context.get('request')

        return [
            request.build_absolute_uri(img.imagem.url)
            for img in obj.imagens.all()
    ]