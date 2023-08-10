from django.shortcuts import render
from django.http import HttpResponseRedirect 
from django.urls import reverse
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from .models import User, Transaction, Category

# Create your views here.
@login_required
def index(request):
    category = Category.objects.filter(owner=request.user.id)

    #technique from https://docs.djangoproject.com/en/dev/ref/models/querysets/#dates & https://stackoverflow.com/questions/678927/select-distinct-years-and-months-for-django-archive-page
    transaction_year = Transaction.objects.filter(owner=request.user.id).dates("date", "year", order="DESC")

    return render(request, 'finance/index.html', {
        "category": category,
        "transaction_year": transaction_year
    })



#register, login and logout methods taken from past Web50 projects
def register(request):
    if request.method == "POST":
        username = request.POST["username"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "finance/register.html", {
                "message": "Passwords must match."
            })
        # Attempt to create new user
        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()
        except IntegrityError:
            return render(request, "finance/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        
        return HttpResponseRedirect(reverse("finance:index"))
    else:
        return render(request, "finance/register.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("finance:index"))
        else:
            return render(request, "finance/login.html", {
                "message": "Invalid email and/or password."
            })
    else:
        return render(request, "finance/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("finance:login"))