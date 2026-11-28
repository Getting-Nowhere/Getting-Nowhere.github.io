---
layout: page
title: "Mass Assignment"
subtitle: "Setting protected model attributes such as roles or approval flags through extra request parameters"
permalink: /methodology/common-apps/mass-assignment/
---

Mass assignment happens when a framework copies every submitted parameter into an object or database record without checking which fields the user may set. A registration form that also sends a hidden or unexpected field can then change an attribute the form never exposed, such as an approval flag, a role or a price. This page covers how to recognise the pattern, how to test it in an application, and how frameworks prevent it.

## The vulnerable pattern

In a Ruby on Rails model, the allowed attributes are declared explicitly. Attributes that are not declared should not be assignable:

```ruby
class User < ActiveRecord::Base
  attr_accessible :username, :email
end
```

If the controller passes the whole request into the model, and the model protects no other attribute, a request containing `admin` is accepted:

```json
{ "user": { "username": "USERNAME", "email": "USER@DOMAIN.TLD", "admin": true } }
```

The same flaw appears in other frameworks. In the notes, a Python application inserted a registration flag directly from a form field:

```python
try:
    if request.form['confirmed']:
        cond = True
except:
    cond = False
cur.execute('insert into users values(?,?,?)', (username, password, cond))
```

Any value for `confirmed` sets the flag, because the code tests only that the key exists.

## Testing procedure

1. Register or update a profile normally. Capture the request in Burp Suite or a similar proxy.
2. Look at the response and any later behaviour. Notes such as "account pending approval" show that a server-side flag controls access.
3. If source code is available, read the model and the controller. Identify fields that the form does not send but the object accepts.
4. Add candidate parameters to the request, one at a time, such as `admin`, `role`, `confirmed`, `is_active` or `balance`.
5. Log in or reload the page and check whether the new attribute took effect.

```http
POST /register HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=USERNAME&password=PASSWORD&confirmed=TESTVALUE
```

In the notes, sending any value for `confirmed` bypassed the approval step, and the account could log in without waiting for the administrator.

## What to look for

- Account states such as pending approval, email verification or activation that a request can change.
- Role, permission or group fields that appear in responses or in the API schema but not in the form.
- Price, quantity or balance fields on checkout or profile endpoints.
- Responses that echo back attributes the user should not control.

> Test only on accounts and data you are authorised to change. Use a test account where possible, and revert any changes to shared records.
{: .warning }

## Pitfalls

- A parameter that is accepted but ignored is not a finding. Confirm the attribute changed the behaviour.
- Some frameworks filter attributes by default. A failed test does not prove the absence of the flaw on other endpoints.

## Defense and prevention

Declare the allowed fields explicitly for every create and update action. In Rails this is done with strong parameters, where the controller returns only the permitted attributes:

```ruby
class UsersController < ApplicationController
  def create
    @user = User.new(user_params)
    if @user.save
      redirect_to @user
    else
      render 'new'
    end
  end

  private

  def user_params
    params.require(:user).permit(:username, :email)
  end
end
```

The method returns a new hash containing only `username` and `email`, so any other input is ignored. Apply the same allowlist approach in every framework, keep privileged attributes out of user-writable models, and enforce authorisation on the server for each change. See the [application hardening](/methodology/common-apps/prevention/) page.
