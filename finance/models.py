from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import date

# Create your models here.

class User(AbstractUser):
    pass

class Category(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=30)
    color = models.CharField(max_length=7, default="#ffffff")

    def __str__(self):
        return self.name

    def is_compliant(self):
        if self.name == "":
            return False
        return True

# for the choice, followed this doc https://docs.djangoproject.com/en/4.2/ref/models/fields/#django.db.models.Field.choices
# for the date field having a default value that users can override, followed this https://docs.djangoproject.com/en/4.2/ref/models/fields/#django.db.models.DateField
class Transaction(models.Model):
    TYPES = [
        ("D", "Deposit"),
        ("W", "Withdraw")
    ]
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_transaction')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='category_transaction')
    type = models.CharField(max_length=30, choices=TYPES, default="D")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=date.today())