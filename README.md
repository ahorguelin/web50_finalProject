# WEB50 Capstone: Finance

## Distinctiveness and Complexity

The goal of this app is to track personal finance movements within saving accounts. This app aims to give users more visibility than what is typically shown on basic banking dashboards. For instance, when users deposit $100 into their savings account, they might want to allocate $50 for an upcoming car expense, $20 for buying gifts, and the rest as a security fund. The goal is to be able to create any category of savings users might desire and deposit money into it accordingly.

The scope of this project is different from previous web50 projects as it focuses on managing one's personal finance. The focus was placed on the user interface and usability in mobile mode. This project also goes further in the models (and by extension, serializers) by adding custom methods that allow for better processing of user data.

This project also focuses on user interactivity with the UI. To this end, most of the application is rendered without requiring page reloads. This is made possible by using asynchronous JavaScript processes and custom-made APIs. All forms are submitted with JavaScript. For added security, APIs used are not CSRF exempt. The CSRF key is instead passed in the header of the API calls through JavaScript.

Regarding complexity, this project was created using the Django Rest Framework. This added the challenge of using serializers as well as custom validators to ensure the data that was inputted by users was clean.

Most of the complexity comes from ensuring the UI remains responsive and that all scenarios for user interactivity are explored. As the app almost never requires a page reload, it was important that all records created by the users would then be available for them to interact with in the various forms. For instance, users should be able to add a transaction to a category they just created.

Another example was to display error messages to the user in popups that would disappear after a short time so that the user had feedback if their inputs were incorrect.

The most complex feature of this project was handling a category deletion by a user. This required rendering a new interface popup that would allow them to select from different options. This required a strong link between the front and back-end as well as further investigating how the JavaScript fetch method and Django Serializers interact.

### Running the application
To run the application, run the following command from the root of the directory:
- Windows: python manage.py runserver
- Mac / Linux: python3 manage.py runserver



## Features summary 
### Transaction

### Home page
From the home screen, users can see the total balance of each category they created. Any category will show how much was saved and how much was spent (default value will be the current year). Users also have the possibility to see the balance since the category creation. Users can also choose a timeline (for instance, last month, last year) to see the balances made that year.

#### Deposit, withdraw
Users can click the "New transaction" button to deposit or withdraw money to a category. Form security checks for negative values and ensure that they indeed have enough funds in the category they wish to withdraw from before completing the transaction. Upon submitting the form, the page will be reloaded asynchronously so that the category balances are updated without needing a page reload.


### All transactions
All transactions made since the beginning can be found. Those transactions can also be filtered by a month or a year. Transaction amount can be modified, and the record itself can be deleted from this screen as well.


### Categories
Users can see all their categories, add any they wish to, or remove the ones they no longer use. Categories that are added are done so without requiring a page reload. All inputs are handled through a Django Rest API, allowing to post the information retrieved from a form.
When users decide to remove a category that still has allocated transactions, they have two possibilities:

1. Allocate all transactions to another category (assuming one exists).
2. Delete all transactions allocated to the category to be deleted.

### Filtering
On the top of the transaction and home page, users are able to select a month and a year for which they wish to consult the records. On the home page, this will allow them to see how much was saved and spent given a month and/or a year. On the transaction page, this will allow users to see every record that was created during the given timeframe.


## APIS (api/views.py)
All APIs are stored in a separate Django application called "api" (more precisely in views.py). This was made to keep the different Python files clean and separated. All APIs used asynchronously will be found on the "api" Django app. Similarly, all static renders of HTML templates will be found on the "finance" Django app.\

1. Category
- Allowed methods: POST, GET
- This API allows users to create categories and render them in real-time on the front-end. Information is inputted from the Category form where users get to choose a name and a color.
2. Transaction
- Allowed methods: POST, GET, PUT
- Similar to the Transaction category. Also allows the user to modify the transaction amount.
3. Delete
- Allowed method: DELETE
- Allows the user to delete either a transaction or a category. In the case of a category (and if chosen by the user), all children records of the category to be deleted will be transferred to another category chosen by the user.

## Views (finance/views.py)
All functions in this file allow users to register, login, logout, and render the index page of the app. The user management (login, register, logout) is the same as the one used in the previous web50 project.

The index function simply renders the index.html template located on the finance app. It passes two pieces of information in the context:
- The categories that the user has previously created.
- The years for which the user has created records for. 

## Models (finance/models.py)

1. Transaction\
Contains the following fields:
    - Date: automatically populated by default. Users can override this behavior if needed.
    - Type: whether the transaction is a deposit (adding money to a category) or a withdrawal (removing money from the category).
    - Amount: mandatory currency field.
    - Category: allows users to allocate a transaction (Deposit or withdrawal) to a category. This is the cornerstone of the application as this is what allows having a view of finances.
2. Categories \
Contains the following fields:
    - Name: users can set the name of the category of their choice. The categories then allow users to allocate or withdraw funds from a specific category.
    - Color: char field containing hexadecimal values of a color. This allows users to further personalize a category.

## Serializers (api/serializers.py)

1. TransactionSerializer\
Created to handle async calls from the front-end. Contains all fields from the Transaction model.
**Custom field**
    - category_name: used to display the category name related to the transaction instead of its Id on the front-end.
**Custom validator**
    - validate_amount: ensures that users have enough deposits before allowing the withdrawals of funds on a given category.
2. CategorySerializer\
Created to handle async calls from the front-end. Contains all fields from the Category model.\
**Custom fields**
    - deposit: custom serializer method field that queries the database for all deposit transactions related to a particular category. Is used on the front-end to display the total amount of money users have allocated to a category.
    - withdrawal: same reasoning as deposit. Is used together with deposit to compute the balance of the category and display it to the user.
**Custom validator**
    - validate_name: upon saving a category, checks that no other categories with the same name already exist.

## Front end (finance/templates/finance & finance/static/finance)
### HTML templates and CSS
This web app uses Tailwind CSS and HTML templates to render most of its dynamic content.
Four templates were created, namely:
- layout.html: contains all the navbar elements that allow users to cycle through the different app features. This template is extended by all the others below.
- index.html: created and used to render the user data. Most of the application automation and functions happen in this template. As the Finance app makes use of Django Rest Framework, the index page does not need to be reloaded to display updated information to the user. Users must be logged in to access this page. Otherwise, they are redirected to the Login template.
- register.html: contains a Django form that allows users to create an account. The username does not have to be an email address.
- login.html: once users have an account, they can log in through this form.

### JavaScript 
This file contains the main logic of the application and renders most of the elements that the user can interact with.
It first scans for the DOM content to be loaded before resetting the application and UI. After which, it loads the getCategory() function (see below).

Here are the main functions of the file:
1. loadPage(pageToLoad): is called whenever users click on a navbar button. The function scans for the data in the button that was pressed, disable all pages but the one the user asked for.

2. loadContent(content): is called whenever users click on a "New" type button. The function either expands or retracts the form the user clicked on.

3. getCategory(): makes a GET request to the category API (api/views.py). For each category that was created, the function renders a container on the screen with the following information (given the chosen date):
    - Category name
    - Category balance
    - Category withdrawals
    - Category deposits
    The function also creates a button that allows users to delete a category of their choosing.

4. createCategory(): makes a POST request to the category API (api/views.py). If users try to create a category with the same name as one they previously created, they are prevented from doing so and receive a warning message. After a successful category creation, the new category gets appended to the form so that the user can use it to add transactions.

5. createTransaction(): makes a POST request to the transaction API (api/views.py). A few checks are made:
    - If the transaction withdraws funds from a category, the API first checks that there are enough funds allocated to said category to proceed with the withdrawal. If that is not the case, the transaction does not get saved, and the user receives a warning message.
    - If the transaction year is not yet present on the filtering menu at the top of the page, it gets added without needing a page reload.

6. getTransaction(): makes a GET request to the transaction API (api/views.py) and renders the following information on an HTML container:
    - Transaction category name
    - Transaction date
    - Transaction amount
    - Using the date filter at the top of the page, users are able to add query parameters to the GET request. This allows users to be shown all transaction records for a given date.  
    - On each transaction, two buttons are added: one for deleting the transaction, and one for editing its amount  

7. editTransaction(): this function is triggered whenever a user clicks on the pencil icon on a transaction. The transaction amount will then be swapped to an input form that will allow users to enter the new amount that should be registered on the transaction record.

8. saveTransaction(): makes a PUT request to the transaction API (api/views.py). Before submitting the data, the amount entered by the user is checked. If the user entered a negative or non-numerical number, they receive a warning message, and the record does not get saved.

9. deleteRecord(): makes a DELETE call to the delete_record API (api/views.py). Depending on the record to be deleted (i.e., transaction or category), two scenarios are possible:
    1. If the record is a transaction, it simply gets deleted, and the transaction page is re-rendered.
    2. If the record is a category, users are presented with the following choice:
        - Delete the category and all its children records.
        - Allocate all children records to another category that users can choose.
        - This choice is made on a context-screen that is rendered if the record to delete is a category.
