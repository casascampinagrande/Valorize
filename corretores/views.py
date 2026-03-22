from django.http import HttpResponse

def confirmar_plano(request, plan_id):
    # Aqui futuramente integrará com a API da pagar.me
    # Por enquanto, apenas redireciona para o perfil do usuário logado
    from django.shortcuts import redirect
    return redirect('perfil')
def planos(request):
    return render(request, "planos.html")
from django.db.models import Value as V
from django.db.models.functions import Concat
from rest_framework.decorators import api_view

from corretores import models
from django.db.models import Q
@api_view(["GET"])
def sugestoes_cidade(request):
    termo = request.GET.get("q", "").strip()
    uf = request.GET.get("uf", "").strip().upper()
    if not uf:
        return Response([])
    qs = Anuncio.objects.filter(uf=uf)
    if termo and len(termo) >= 2:
        qs = qs.filter(Q(cidade__icontains=termo))
    # Retorna as cidades mais comuns primeiro
    cidades = (
        qs.values_list('cidade', flat=True)
        .annotate()
        .distinct()
    )
    # Opcional: limitar a 10 cidades
    cidades = list(cidades)[:10]
    return Response(cidades)
from rest_framework import status, response, views, generics
from rest_framework.generics import RetrieveUpdateAPIView
from .serializers import RegistroCorretorSerializer, AnuncioSerializer, UserSerializer
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User 
from django.shortcuts import redirect
from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.forms import PasswordResetForm
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import Anuncio, AnuncioImagem
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser


def home(request):
    # Anúncios mais acessados (top 8)
    anuncios_populares = Anuncio.objects.filter(ativo=True).order_by('-acessos', '-data_criacao')[:8]
    # Novidades (mais recentes)
    anuncios_novos = Anuncio.objects.filter(ativo=True).order_by('-data_criacao')[:12]
    return render(request, "index.html", {"anuncios": anuncios_novos, "anuncios_populares": anuncios_populares})

def login(request):
    return render(request, "login.html")

def registro(request):
    return render(request, "registro.html")

def esqueceu_senha(request):
    return render(request, "esqueceu_senha.html")

def perfil(request, pk=None):
    # `pk` é opcional: quando presente a página mostra o perfil público desse usuário
    return render(request, "perfil.html", {"profile_id": pk})


def perfil_redirect(request):
    # Algumas versões/links antigos podem apontar para /login/perfil.html
    # Redirecionamos para a rota canonical /perfil/ para evitar 404
    return redirect('perfil')

def suporte(request):
    return render(request, "suporte.html")

def ativacao_sucesso(request):
    return render(request, "ativacao_sucesso.html")

def terms(request):
    return render(request, "terms.html")

def privacy(request):
    return render(request, "privacy.html")

def anunciar(request):
    return render(request, "anunciar.html")

def editar_anuncio(request, pk):
    return render(request, "anunciar.html", {"anuncio_id": pk})

def confirmacao_pendente(request):
    return render(request, "confirmacao_pendente.html")

# ===== API =====

class RegistroView(views.APIView):
    def post(self, request):
        serializer = RegistroCorretorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return response.Response({"mensagem": "Corretor cadastrado! Verifique seu e-mail para ativar a conta."}, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AtivarContaView(views.APIView):
    def get(self, request, uidb64, token): 
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return redirect('ativacao_sucesso')
        else:
            return response.Response({"erro": "Link de ativação inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)
        
class ChecarAtivacaoView(views.APIView):
    def get(self, request):
        email = request.query_params.get('email')
        try:
            user = User.objects.get(email=email)
            return response.Response({"ativo": user.is_active})
        except User.DoesNotExist:
            return response.Response({"error": "Usuário não encontrado"}, status=404)

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(views.APIView):
    def post(self, request):
        email_digitado = request.data.get('username')
        senha_digitada = request.data.get('password')

        try:
            user_obj = User.objects.get(email=email_digitado)
            user = authenticate(username=user_obj.username, password=senha_digitada)
        except User.DoesNotExist:
            user = None

        if user is not None:
            if user.is_active:
                token, _ = Token.objects.get_or_create(user=user)
                return response.Response({"token": token.key, "id": user.id}, status=status.HTTP_200_OK)
            else:
                return response.Response({"erro": "Ative sua conta no e-mail."}, status=status.HTTP_400_BAD_REQUEST)
        
        return response.Response({"erro": "E-mail ou senha incorretos."}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        return Response({"detail": "Método GET não é permitido nesta rota."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
class SolicitarResetSenhaView(views.APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            # Gerar Token e UID
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Link para a página de nova senha no FRONT-END
            # O link leva para o HTML, passando o token na URL
            link = f"redefinir_senha.html?uid={uid}&token={token}"
            
            send_mail(
                'Recuperação de Senha - Valorize',
                f'Clique no link para criar uma nova senha: {link}',
                'noreply@valorize.com',
                [email],
                fail_silently=False,
            )
            return response.Response({"mensagem": "E-mail de recuperação enviado!"})
        except User.DoesNotExist:
            # Por segurança, não confirmamos se o e-mail existe ou não
            return response.Response({"mensagem": "Se este e-mail estiver cadastrado, você receberá um link."}, status=200)
        
class ConfirmarResetSenhaView(views.APIView):
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        nova_senha = request.data.get('nova_senha')

        print(f"DEBUG UID RECEBIDO: {uidb64}")

        try:
            # Tenta decodificar o UID
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception as e:
            print(f"Erro na decodificação: {e}")
            # RETORNA UM ERRO EM VEZ DE NADA
            return response.Response({"erro": "Link inválido ou malformado."}, status=status.HTTP_400_BAD_REQUEST)

        if user is not None:
        # Verificação manual para debug
            is_token_valid = default_token_generator.check_token(user, token)
            print(f"DEBUG: O token é válido? {is_token_valid}")
        
        if is_token_valid:
            user.set_password(nova_senha)
            user.save()
            return response.Response({"mensagem": "Senha alterada!"})
        else:
            # Se cair aqui, o token realmente não bate com o estado atual do user
            return response.Response({"erro": "Token inválido para este usuário."}, status=400)
        
class PerfilCorretorView(generics.RetrieveUpdateAPIView):

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            self.get_object(),
            context={'request': request}
        )

        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

class PerfilPublicView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"erro": "Usuário não encontrado."}, status=404)

        anuncios = Anuncio.objects.filter(corretor=user)
        anuncios_data = [{
            "id": a.id,
            "title": a.titulo,
            "price": f"R$ {a.preco}",
            "city": a.cidade,
            "bairro": a.bairro,
            "finalidade": a.finalidade,
            "created": a.data_criacao.isoformat() if a.data_criacao else None,
            "image": request.build_absolute_uri(a.imagem_capa.url) if a.imagem_capa else "https://via.placeholder.com/300"
        } for a in anuncios]

        corretor = getattr(user, 'corretor', None)

        if corretor and corretor.foto:
            avatar = request.build_absolute_uri(corretor.foto.url)
        else:
            avatar = "https://via.placeholder.com/150"

        # Adiciona creci e telefone se existirem
        creci = corretor.creci if corretor and corretor.creci else ''
        telefone = corretor.telefone if corretor and corretor.telefone else ''

        return Response({
            "id": user.id,
            "username": user.username,
            "nome": corretor.nome if corretor else user.username,
            "foto": avatar,
            "creci": creci,
            "telefone": telefone,
            "memberSince": user.date_joined.strftime("%m/%Y"),
            "location": "Paraíba, Brasil",
            "anuncios": anuncios_data
        })

class AnuncioListView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        usuario = request.user if request.user and request.user.is_authenticated else None
        anuncios_qs = Anuncio.objects.all().order_by('-data_criacao')
        anuncios = []
        for a in anuncios_qs:
            anuncios.append({
            'id': a.id,
            'title': a.titulo,
            'description': a.descricao,
            'price': f"R$ {a.preco}",
            'city': a.cidade,
            'bairro': a.bairro,
            'rooms': a.quartos,
            'image': request.build_absolute_uri(a.imagem_capa.url) if a.imagem_capa else 'https://via.placeholder.com/300',
            'owner_id': a.corretor.id,
            'mine': usuario.id == a.corretor.id if usuario else False,
            'created': a.data_criacao.isoformat(),
        })

        return Response({'results': anuncios})



class AnuncioDetailView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk, *args, **kwargs):
        try:
            a = Anuncio.objects.get(pk=pk)
        except Anuncio.DoesNotExist:
            return Response({"detail": "Anúncio não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if not a.ativo:
            if not request.user.is_authenticated or a.corretor != request.user:
                return Response({"detail": "Este anúncio ainda não está ativo."}, status=status.HTTP_403_FORBIDDEN)

        # Incrementa o contador de acessos
        a.acessos = (a.acessos or 0) + 1
        a.save(update_fields=["acessos"])

        images = []
        if a.imagem_capa:
            images.append(request.build_absolute_uri(a.imagem_capa.url))
        for img in a.imagens.all():
            images.append(request.build_absolute_uri(img.imagem.url))

        corretor = a.corretor
        telefone = ""
        if hasattr(corretor, "corretor") and corretor.corretor.telefone:
            telefone = corretor.corretor.telefone
        data = {
            "id": a.id,
            "titulo": a.titulo,
            "descricao": a.descricao,
            "preco": a.preco,
            "cidade": a.cidade,
            "uf": a.uf,
            "bairro": a.bairro,
            "quartos": a.quartos,
            "banheiros": a.banheiros,
            "vagas_garagem": a.vagas_garagem,
            "area_m2": a.area_m2,
            "tem_varanda": a.tem_varanda,
            "tem_terraco": a.tem_terraco,
            "finalidade": a.finalidade,
            "categoria": a.categoria,
            "data_criacao": a.data_criacao,
            "imagem_capa": request.build_absolute_uri(a.imagem_capa.url) if a.imagem_capa else '',
            "images": images,
            "owner_id": a.corretor.id if a.corretor else None,
            "telefone": telefone,
            "acessos": a.acessos,
        }

        if request.user.is_authenticated:
            data['mine'] = (a.corretor == request.user)
        else:
            data['mine'] = False

        return Response(data)

    def delete(self, request, pk, *args, **kwargs):
        try:
            anuncio = Anuncio.objects.get(pk=pk)
        except Anuncio.DoesNotExist:
            return Response({"erro": "Anúncio não encontrado."}, status=404)

        # Só o dono pode apagar
        if not request.user.is_authenticated or anuncio.corretor != request.user:
            return Response({"erro": "Permissão negada."}, status=403)

        anuncio.delete()
        return Response({"mensagem": "Anúncio apagado com sucesso."}, status=204)


def anunciar(request, pk=None):
    return render(request, "anunciar.html")

def anuncio_view(request, pk):
    return render(request, 'anuncio.html', {'anuncio_id': pk})

class PublicarAnuncioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        quantidade = Anuncio.objects.filter(corretor=request.user).count()

        if quantidade >= 5:
            return Response(
                {"erro": "Limite de 5 anúncios atingido. Faça upgrade para o plano Pro."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AnuncioSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            anuncio = serializer.save(corretor=request.user)
            imagens = request.FILES.getlist("imagens")
            if imagens:
                # Define a primeira imagem como capa
                anuncio.imagem_capa = imagens[0]
                anuncio.save()
                # Salva todas as imagens na galeria
                for img in imagens:
                    AnuncioImagem.objects.create(
                        anuncio=anuncio,
                        imagem=img
                    )
            return Response(
                {"mensagem": "Anúncio publicado!"},
                status=status.HTTP_201_CREATED
            )
        # Se não for válido, retorna os erros
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EditarAnuncioView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request, pk):
        try:
            anuncio = Anuncio.objects.get(pk=pk, corretor=request.user)
        except Anuncio.DoesNotExist:
            return Response({"erro": "Anúncio não encontrado ou permissão negada."}, status=404)

        serializer = AnuncioSerializer(
            anuncio,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({"mensagem": "Anúncio atualizado!"}, status=200)
        
        return Response(serializer.errors, status=400)