//get session cookies, especially csrf cookie (https://docs.djangoproject.com/en/4.2/ref/csrf/#ajax)
const csrftoken = document.cookie.match(/csrftoken=([^;]+)/)[1]

document.addEventListener('DOMContentLoaded', () => {
        
    // reset the app, load home page
    loadPage('home-page')
    getCategory()

    //Set the transaction date default value to today. Solution came from https://stackoverflow.com/questions/12346381/set-date-in-input-type-date
    document.querySelector('#transaction-date').valueAsDate = new Date()

    //listen for an icon to be pressed and load the correct page with data
    document.querySelector('#home').addEventListener('click', () => {
        loadPage('home-page')
        getCategory()
    })

    document.querySelector('#transaction').addEventListener('click', () => {
        loadPage('transaction-page')
        getTransaction()
    })

    //load form for new transactions if needed
    document.querySelectorAll('[data-type="expand"]').forEach(btn => btn.addEventListener('click', (event) => loadContent(event)))

    //Forms events
    //New category submitted
    document.querySelector('#create-new-category').addEventListener('click', () => createCategory())

    //New transaction subnitted
    document.querySelector('#create-new-transaction').addEventListener('click', () => createTransaction())

    //Prevent negative values on transaction form
    document.querySelector('#transaction-amount').addEventListener('input', (event) => {
        const submitBtn = document.querySelector('#create-new-transaction')
        if (event.target.value == '' || event.target.value.startsWith('-')){
            submitBtn.innerHTML = 'Invalid input'
            submitBtn.disabled =  true
        }
        else if(document.querySelector('#transaction-category').length === 0){
            submitBtn.innerHTML = 'Please add a category'
            submitBtn.disabled =  true
        }
        else{
            submitBtn.disabled = false
            submitBtn.innerHTML = 'Add'
        }
    })

    //prevent form submission if form category name 
    document.querySelector('#category-name').addEventListener('input', (event) =>{
        const catSubmitBtn = document.querySelector('#create-new-category')
        if (event.target.value != ''){
            catSubmitBtn.disabled = false
            catSubmitBtn.innerHTML = 'Add category'
        }
        else{
            catSubmitBtn.disabled = true
            catSubmitBtn.innerHTML = 'Please input a name'
        }      
    })

    //load filters for categories and transactions
    document.querySelectorAll('[data-type="filter"]').forEach(input => input.addEventListener('change', () => {
        getCategory()
        getTransaction()
    }))
})

//Load a page, unload the others
const loadPage = (pageToLoad) =>{
    document.querySelectorAll("[data-type='page']").forEach(appPage => {
        if (appPage.id != pageToLoad){
            appPage.style.display = 'none'
        }
        else{
            appPage.style.display = 'block'
        }
    })
}


//Expand a form wraper to show the form and only expand to its height
const loadContent = (content) =>{
    const formContainer = document.querySelector(`#${content.target.id}-form`)
    formContainer.classList.toggle('visible')
    if (formContainer.classList.contains('visible')){
        formContainer.style.maxHeight = `${formContainer.scrollHeight}px`
    }
    else{
        formContainer.style.maxHeight = 0
    }
}

//get categories created by users
const getCategory = () => {
    const recordYear = document.querySelector('#filter-year')
    const recordMonth = document.querySelector('#filter-month')


    fetch('api/category/?year=' + recordYear.value + '&month=' + recordMonth.value, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(result =>{

        //appropriate container to add categories to
        const catContainer = document.querySelector('#home-container')

        
        //reset container
        catContainer.innerHTML = ''
        //add new elements
        for (res of result){
            //div to contain information
            let catElement = document.createElement('div')
            catElement.classList.add("glass", "sm:w-96", "w-64", "rounded-lg", "p-5")
            
            //category title
            let catTitle = document.createElement('h1')
            catTitle.classList.add('text-white', 'font-bold', 'text-xl', 'mb-5')
            catTitle.innerHTML = res.name

            //category color
            let catColor = document.createElement('div')
            catColor.classList.add('w-full', 'h-2', 'absolute', 'bottom-0', 'left-0','gradient')
            catColor.style.backgroundColor = res.color
            

            //append the created elements to the container
            catElement.append(catTitle)
            catElement.append(catColor)
            
            
            //Show the summary of all categories 
            const catTranCont = document.createElement('div')
            catTranCont.classList.add('flex', 'flex-row', 'justify-between', 'self-center')


            //deposits for the category
            const totDeposit = document.createElement('p')
            totDeposit.classList.add('text-green-600', 'text-lg', 'amount')
            totDeposit.innerHTML = res.deposit.amount__sum > 0 ? `${res.deposit.amount__sum}` : '0'
            
            //withdrawals for the category
            const totWithdrawal = document.createElement('p')
            totWithdrawal.classList.add('text-red-700', 'text-lg', 'amount', 'negative')
            totWithdrawal.innerHTML = res.withdrawal.amount__sum > 0 ? `${res.withdrawal.amount__sum}`: '0'


            //balance for the category
            const catBalance = document.createElement('p')
            catBalance.classList.add('font-bold','text-white', 'text-lg', 'mb-4', 'amount')
            balance = res.deposit.amount__sum - res.withdrawal.amount__sum > 0 ? res.deposit.amount__sum - res.withdrawal.amount__sum : 0
            catBalance.innerHTML =  balance

            //add remaining html elements to the page
            catTranCont.append(totDeposit)
            catTranCont.append(totWithdrawal)

            catElement.append(catBalance)
            catElement.append(catTranCont)

            // create an icon to delete the category, add an element 
            const delCategory = document.createElement('i')
            delCategory.classList.add('fa-solid', 'fa-trash', 'fa-xl',  'ml-3', 'hover:scale-110', 'transition-all', 'absolute', 'right-5', 'top-8')
            delCategory.style.color = '#94a3b8'
            delCategory.setAttribute('data-categoryid', res.id)
            delCategory.addEventListener('click', () => deleteRecord('Category', delCategory.dataset.categoryid))

            catElement.append(delCategory)


            //append the created element to html template
            catContainer.append(catElement)
        }
    })

}


//Create a category based on the info inputed by the user.
const createCategory = () => {
    const catName = document.querySelector('#category-name')
    const catColor = document.querySelector('#category-color')

    fetch('api/category/',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', //https://stackoverflow.com/questions/67543522/unsupported-media-type-text-plaincharset-utf-8-in-request-nextjs-api-error-w

            //correct header name found here: https://stackoverflow.com/questions/26639169/csrf-failed-csrf-token-missing-or-incorrect
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            name: catName.value,
            color: catColor.value
        })
    })
    .then(response => response.json())
    .then(result =>{
        if (result.status === 400){
            //dynamic element created to display error messages
            const toast = document.createElement('div')
            toast.classList.add('rounded-lg', 'bg-slate-200', 'text-slate-800', 'w-fit', 'px-8', 'py-4', 'fixed', 'top-24', 'inset-x-0', 'mx-auto', 'font-bold', 'z-20')
            toast.id = 'toast'
            toast.innerHTML = result.error.name[0]
            document.querySelector('body').append(toast)    
        }

        else{
            //create an option for the select dropdown menu so that no page reload is necessary
            const catOption = document.createElement('option')
            catOption.setAttribute('value', result.message.id)
            catOption.innerHTML = result.message.name
            
            //append the option
            document.querySelector('#transaction-category').append(catOption)
    
            //load all categories
            getCategory(),
    
            //reset the form
            catName.value = '',
            catColor.value = "#000000"
        }
    })
}

const createTransaction = () => {
    const tranType = document.querySelector('#transaction-type')
    const tranCategory = document.querySelector('#transaction-category')
    const tranAmount = document.querySelector('#transaction-amount')
    const tranDate = document.querySelector('#transaction-date')

    fetch('api/transaction/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            category: tranCategory.value,
            type: tranType.value,
            amount: tranAmount.value,
            date: tranDate.value
        })
    })
    .then(response => response.json())
    .then(result  =>{
        if (result.status === 400){
            console.log(result)
            const toast = document.createElement('div')
            toast.classList.add('rounded-lg', 'bg-slate-200', 'text-slate-800', 'w-fit', 'px-8', 'py-4', 'fixed', 'top-24', 'inset-x-0', 'mx-auto', 'font-bold', 'z-20')
            toast.id = 'toast'
            toast.innerHTML = result.error.amount[0]
            document.querySelector('body').append(toast)    
        }
        else{
            // check if date is in the filter slider
            let datePresent = false
            for (option of document.querySelector('#filter-year')){
                if (option.value === result.message.date.substring(0, 4)){
                    //date is present
                    datePresent = true
                    break
                }
            }

            //date not present, add it to the filter
            if (datePresent === false){
                const newDate = document.createElement('option')
                newDate.value = newDate.innerHTML = result.message.date.substring(0, 4)
                document.querySelector('#filter-year').insertBefore(newDate, document.querySelector('#filter-year').firstChild)
            }

            getCategory(),
            tranAmount.value = '',
            tranDate.valueAsDate = new Date()
        }
    })
}

const getTransaction = () =>{
    const recordYear = document.querySelector('#filter-year')
    const recordMonth = document.querySelector('#filter-month')


    fetch('api/transaction/?year=' + recordYear.value + '&month=' + recordMonth.value, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(result => {
        //get the transaction list container and reset its html
        const tranList = document.querySelector('#transaction-list')
        tranList.innerHTML = ''
        for (res of result){

            //create a container for the transaction and add the necessary CSS
            const tranCont = document.createElement('div')
            tranCont.classList.add("glass", "sm:w-96", "w-64", "rounded-lg", "p-3", 'overflow-hidden', 'flex', 'flex-row', 'justify-between', 'self-center')


            //element for containing category and date
            const tranInfo = document.createElement('div')


            //element for transaction category
            const tranCat = document.createElement('h1')
            tranCat.classList.add('text-white', 'text-lg')
            tranCat.innerHTML = res.category_name


            //element for amount 
            const tranAmount = document.createElement('p')
            if (res.type === 'W' ){
                tranAmount.classList.add('text-red-700', 'text-lg', 'amount', 'negative')
                tranAmount.innerHTML = `${res.amount}`
            }
            else{
                tranAmount.classList.add('text-green-600', 'text-lg', 'amount')
                tranAmount.innerHTML = `${res.amount}`
            }


            //element for date
            const tranDate = document.createElement('p')
            tranDate.classList.add('text-sm', 'text-slate-400')
            tranDate.innerHTML = res.date

            //element for options
            const tranOption = document.createElement('div')
            tranOption.classList.add('absolute', 'bottom-1', 'right-3')
            tranOption.setAttribute('data-transactionid', res.id)

            //edit button to which an event listener is added 
            const tranEdit = document.createElement('i')
            tranEdit.classList.add('fa-solid', 'fa-pen', 'hover:scale-110', 'transition-all')
            tranEdit.style.color = '#94a3b8'
            tranEdit.addEventListener('click', (event) => editTransaction(event))

            //delete button to which an event listener is added 
            const tranDelete = document.createElement('i')
            tranDelete.classList.add('fa-solid', 'fa-trash', 'ml-3', 'hover:scale-110', 'transition-all')
            tranDelete.style.color = '#94a3b8'
            tranDelete.addEventListener('click', () => deleteRecord('Transaction', tranOption.dataset.transactionid))


            //apend elements to div
            tranOption.append(tranEdit)
            tranOption.append(tranDelete)

            //add all elements to the above-created div
            tranInfo.append(tranCat)
            tranInfo.append(tranDate)
            tranCont.append(tranInfo)
            tranCont.append(tranAmount)
            tranCont.append(tranOption)

            // the the element to the html template
            tranList.append(tranCont)
        }
    })
}

const editTransaction = (transaction) => {
    const tranId = transaction.target.parentElement.dataset.transactionid
    const tranAmount = transaction.target.parentElement.previousSibling

    //create an input to accomodate user input
    const editAmount = document.createElement('input')
    editAmount.classList.add('w-24', 'h-7', 'text-right', 'px-2', 'bg-slate-200', 'rounded-lg', 'text-slate-800')
    editAmount.setAttribute('inputmode', 'numeric')
    editAmount.value = tranAmount.innerHTML

    //add the input and the save button
    tranAmount.replaceWith(editAmount)

    const tranSave = document.createElement('i')
    tranSave.classList.add('fa-solid', 'fa-clipboard-check', 'hover:scale-110', 'transition-all')
    tranSave.addEventListener('click', () => saveTransaction(tranId, editAmount))
    tranSave.style.color = '#94a3b8'

    transaction.target.replaceWith(tranSave)
}

const saveTransaction = (transactionId, transactionAmount) => {
    //prevent users from entering negative or non numerical values
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
    if (transactionAmount.value < 0 || isNaN(transactionAmount.value)){
        const toast = document.createElement('div')
        toast.classList.add('rounded-lg', 'bg-slate-200', 'text-slate-800', 'w-fit', 'px-8', 'py-4', 'fixed', 'top-24', 'inset-x-0', 'mx-auto', 'font-bold', 'z-20')
        toast.id = 'toast'
        toast.innerHTML = 'Only positive and numerical values allowed'
        document.querySelector('body').append(toast)    

        return false
    }

    fetch('api/transaction/',{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            id: transactionId,
            amount: transactionAmount.value
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result)
        getTransaction()
    })
}

const deleteRecord = (recordType, recordId) => {
    //check is record type is a category
    if (recordType === 'Category'){
        //blur the screen for the contextual action
        const divContainer = document.createElement('div')
        divContainer.classList.add('glass', 'w-screen', 'h-screen', 'z-30', 'absolute', `top-[${scrollY}px]`)

        //create the div to hold the information
        const actionContainer = document .createElement('div')
        actionContainer.classList.add('rounded-lg', 'bg-slate-200', 'text-slate-800', 'w-fit', 'px-8', 'py-4', 'fixed', 'top-24', 'inset-x-0', 'mx-auto', 'font-bold', 'z-31')

        //inform the user
        const infoText = document.createElement('p')
        infoText.innerHTML = 'You are about to delete a category. Dou you wish to delete all associated transactions, or allocate them to another category?'
        actionContainer.append(infoText)

        //div with possibilities
        const actions = document.createElement('div')
        actions.classList.add('flex', 'flex-row', 'flex-wrap', 'justify-between', 'my-4')

        //options selectors
        const categoryAction = document.createElement('select')
        categoryAction.classList.add('block', 'p-2', 'rounded-lg', 'border-slate-500', 'focus:outline-none',  'bg-slate-300', 'text-slate-800')
        
        for (let option of document.querySelector('#transaction-category')){
            if (option.value === recordId){
                continue
            }
            let cat = document.createElement('option')
            cat.value = option.value;
            cat.innerHTML = option.innerHTML
            categoryAction.append(cat)
        }

        const delOption = document.createElement('option')
        delOption.setAttribute('value', 'delete')
        delOption.innerHTML = 'Delete all transactions'
        categoryAction.append(delOption)


        //button to save the action
        const saveAction = document.createElement('button')
        saveAction.classList.add('block', 'p-2', 'rounded-lg', 'border-slate-500', 'focus:outline-none',  'bg-red-700', 'text-white')
        saveAction.innerHTML = 'Continue'
        saveAction.addEventListener('click', () =>{
            fetch('api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    id: recordId,
                    type: recordType,
                    action: categoryAction.value
                })
            })
            .then(response => response.json())
            .then(result => {
                divContainer.remove()
                for (option of document.querySelector("#transaction-category")){
                    if (option.value == recordId){
                        option.remove()
                    }
                }
                getCategory()
            })
        })


        //button to cancel category deletion
        const cancelAction = document.createElement('button')
        cancelAction.innerHTML = 'Cancel'
        cancelAction.classList.add('block', 'p-2', 'rounded-lg', 'border-slate-500', 'focus:outline-none',  'bg-slate-800', 'text-white')
        cancelAction.addEventListener('click', () => {
            divContainer.remove()
        })



        actions.append(categoryAction)
        actions.append(saveAction)
        actions.append(cancelAction)

        actionContainer.append(actions)

        divContainer.append(actionContainer)
        document.querySelector('body').append(divContainer)
    }

    else{
        //delete transaction records
        fetch('api/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                id: recordId,
                type: recordType
            })
        })
        .then(response => response.json())
        .then(result => {
            getTransaction()
        })
    }
} 
