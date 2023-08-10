from rest_framework import serializers
from rest_framework.serializers import ValidationError
from finance.models import Category, Transaction
from django.db.models import Sum


#https://www.django-rest-framework.org/tutorial/1-serialization/#using-modelserializers
class CategorySerializer(serializers.ModelSerializer):
    deposit = serializers.SerializerMethodField()
    withdrawal = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = '__all__'

    #reasoning: the category is called by id. All categories are user made and are therefore associated with a new id. It's then impossible for a user to query a category of the same name created by another user
    #method from https://docs.djangoproject.com/en/4.2/topics/db/aggregation/ & https://stackoverflow.com/questions/73352700/calculate-sum-of-model-objects-in-django-serializers

    #https://www.django-rest-framework.org/api-guide/serializers/#including-extra-context
    #https://stackoverflow.com/questions/36901/what-does-double-star-asterisk-and-star-asterisk-do-for-parameters
    #https://stackoverflow.com/questions/42760593/simplify-multiple-optional-filters-in-django

    def get_deposit(self, obj):
        query_parameters = {'category': obj.id, 'type': 'D'}

        if self.context:
            if self.context["year"] != 'all':
                query_parameters['date__year'] = self.context["year"]
            
            if self.context["month"] != 'all':
                query_parameters['date__month'] = self.context["month"]
        
        return Transaction.objects.filter(**query_parameters).aggregate(Sum("amount"))

    def get_withdrawal(self, obj):
        query_parameters = {'category': obj.id, 'type': 'W'}
        if self.context:
            if self.context["year"] != 'all':
                query_parameters['date__year'] = self.context["year"]
            
            if self.context["month"] != 'all':
                query_parameters['date__month'] = self.context["month"]

        return Transaction.objects.filter(**query_parameters).aggregate(Sum("amount"))
    
    #found in https://www.django-rest-framework.org/api-guide/validators/#writing-custom-validators
    #and https://stackoverflow.com/questions/61355764/django-rest-framework-custom-serializers-validationerror-not-working
    #https://stackoverflow.com/questions/33739963/how-to-write-a-custom-field-validation-for-modelserializers-in-django-rest-frame
    def validate_name(self, value):
        if Category.objects.filter(name = value).exists():
            raise ValidationError("This category already exists.")
        return value



class TransactionSerializer(serializers.ModelSerializer):
    #found in https://www.django-rest-framework.org/api-guide/fields/#source through https://stackoverflow.com/questions/52491330/how-to-get-foreignkey-field-name-instead-of-id-in-django-rest-framework

    category_name = serializers.CharField(source="category.name", required=False)
    class Meta:
        model = Transaction
        fields = '__all__'

    #check if user has enough balance on a category to withdraw funds
    #https://stackoverflow.com/questions/6160648/annotating-a-sum-results-in-none-rather-than-zero
    def validate_amount(self, value):
        if value == "":
            raise ValidationError("Cannot create a transaction without an amount")
        
        if self.initial_data["type"] == 'W':
            category_deposits = Transaction.objects.filter(category = self.initial_data["category"], owner = self.initial_data["owner"], type='D').aggregate(Sum("amount", default = 0))
            category_withdrawals = Transaction.objects.filter(category = self.initial_data["category"], owner = self.initial_data["owner"], type='W').aggregate(Sum("amount", default = 0))

            balance = float(category_deposits['amount__sum']) - float(category_withdrawals['amount__sum']) - float(value)
            if balance < 0:
                raise ValidationError("Insufficient balance on the category")
        return value
    
