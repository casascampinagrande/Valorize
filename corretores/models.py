from django.db import models
from django.contrib.auth.models import User


class Corretor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nome = models.CharField(max_length=150)

    creci = models.CharField(max_length=20, null=True, blank=True)
    telefone = models.CharField(max_length=20, null=True, blank=True)

    cpf_cnpj = models.CharField(max_length=20, unique=True)

    data_cadastro = models.DateTimeField(auto_now_add=True)

    foto = models.ImageField(upload_to='perfis/', null=True, blank=True)

    PLANOS_CHOICES = [
        ('basico', 'Básico (Grátis)'),
        ('pro', 'Pro (R$ 5,99)'),
        ('premium', 'Premium (R$ 7,99)'),
    ]

    plano = models.CharField(max_length=10, choices=PLANOS_CHOICES, default='basico')

    @property
    def limite_anuncios(self):
        limites = {
            'basico': 5,
            'pro': 10,
            'premium': 15
        }
        return limites.get(self.plano, 5)

    def __str__(self):
        return f"{self.nome} - {self.creci}"


class Anuncio(models.Model):

    FINALIDADE_CHOICES = [
        ('venda', 'Venda'),
        ('aluguel', 'Aluguel'),
    ]

    CATEGORIA_CHOICES = [
        ('Casa', 'Casa'),
        ('Apartamento', 'Apartamento'),
        ('Ponto Comercial', 'Ponto Comercial'),
        ('Sitio', 'Sítio'),
        ('Fazenda', 'Fazenda'),
        ('Condominio Fechado', 'Condomínio Fechado'),
    ]

    corretor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='anuncios')

    titulo = models.CharField(max_length=200)
    descricao = models.TextField()

    preco = models.DecimalField(max_digits=12, decimal_places=2)

    cidade = models.CharField(max_length=100)
    uf = models.CharField(max_length=2, verbose_name='UF')
    bairro = models.CharField(max_length=100)

    quartos = models.IntegerField(default=0, null=True, blank=True)
    banheiros = models.IntegerField(null=True, blank=True)
    vagas_garagem = models.IntegerField(null=True, blank=True)

    area_m2 = models.FloatField(null=True, blank=True)

    tem_varanda = models.BooleanField(default=False)
    tem_terraco = models.BooleanField(default=False)

    finalidade = models.CharField(max_length=20, choices=FINALIDADE_CHOICES, default='venda')
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES, default='Casa')

    data_criacao = models.DateTimeField(auto_now_add=True)

    ativo = models.BooleanField(default=True)

    imagem_capa = models.ImageField(upload_to='anuncios/', null=True, blank=True)

    acessos = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.titulo} - {self.cidade}"
    
class AnuncioImagem(models.Model):

    anuncio = models.ForeignKey(
        Anuncio,
        related_name="imagens",
        on_delete=models.CASCADE
    )

    imagem = models.ImageField(upload_to="anuncios/")

    def __str__(self):
        return f"Imagem do anúncio {self.anuncio.id}"