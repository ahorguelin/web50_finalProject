import json
from rest_framework.response import Response
from rest_framework.decorators import api_view
from finance.models import Transaction, Category
from django.db.models import Sum
from django.db.models.functions import Coalesce
from .serializers import CategorySerializer, TransactionSerializer

@api_view(['POST', 'GET'])
def category(request):
    user_id = request.user.id
    if request.method == 'POST':
        #adding owner id for serializer to be valid
        request.data["owner"] = user_id
        serializer = CategorySerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": serializer.data, "status": 200})
        else:
            return Response({"error": serializer.errors, "status": 400})

    if request.method == 'GET':
        year = request.GET.get("year")
        month = request.GET.get("month")

        category = Category.objects.filter(owner = user_id)
        serializer = CategorySerializer(category, many=True, context={'year': year, 'month': month})

        return Response(serializer.data)


@api_view(['POST', 'GET', 'PUT'])
def transaction(request):
    user_id = request.user.id
    if request.method == 'POST':
        request.data["owner"] = user_id

        serializer = TransactionSerializer(data=request.data)

        #sends success or error message so that user is warned
        if serializer.is_valid():
            serializer.save()
            return Response({"message": serializer.data, "status": 200})
        else:
            return Response({"error": serializer.errors, "status": 400})

    if request.method == 'GET':
        query_filters = {'owner': user_id}

        if request.GET.get('year') != 'all':
            query_filters['date__year'] = request.GET.get('year')
        
        if request.GET.get('month') != 'all':
            query_filters['date__month'] = request.GET.get('month')

        #order by date then by id ascending so that record are presented at the date they were created, then by their recency. Made to use a date field only, and limit user input on time   
        transaction = Transaction.objects.filter(**query_filters).order_by('-date', '-id')
        serializer = TransactionSerializer(transaction, many=True)

        return Response(serializer.data)

    if request.method == 'PUT':
        #get the data and related transaction
        data = json.loads(request.body)
        transaction = Transaction.objects.get(id = data.get("id"))

        #modify the amount
        transaction.amount = data.get("amount")
        transaction.save()
        return Response("Update successful")


@api_view(['DELETE'])
def delete(request):
    #get data from the front end
    data = json.loads(request.body)
    
    if data.get("type") == "Transaction":
        try:
            record = Transaction.objects.get(id = data.get("id"))
        except:
            return Response("No records matching this id")

        if record.owner != request.user:
            return Response("You cannot delete a record you are not the owner of")
        
        else:
            record.delete()
            return Response("record was deleted")
    
    #deleting a category
    else:
        try:
            record_to_delete = Category.objects.get(id = data.get("id"))
        except:
            return Response("No records matching this id")
        
        #user decided to allocate transactions to another category
        if data.get("action") != 'delete':
            transactions_to_move = Transaction.objects.filter(category = data.get("id"), owner = request.user)
            transactions_to_move.update(category = data.get("action"))

        record_to_delete.delete()
        return Response("record was deleted")

