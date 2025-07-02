# Building MIA: A WhatsApp AI Assistant to Escape Subscription Hell

The average person pays for 12+ subscription services, spending $273/month [according to recent studies according to the new source of truth delivered by your favorite socially awkward CEO, Sam Altman](https://chat.openai.com). As a developer, I realized I was paying for solutions I could build myself, starting with a $5/month task manager that does what a WhatsApp bot could do for (sort of) free.

So okay, as a first (content) post here, I thought a good idea would be to do something completely unrelated with computer vision, just because.

## The Subscription Trap 

I've been using generative models since first versions of Stable Diffusion and ChatGPT 3. Quite overwhelming back then to follow the rhythm of releases of new versions, LoRA, bla bla that kinda dropped the ball and went back to use consumer ready applications in the form of Midjourney and as I said ChatGPT. LLMs are now what they are, and with the advent of MCPs, tools and the capacity of forcing them to output structured data, sort of, lighted a spark on me to try to do something with all of this.

You know, I am no stranger to the subscription-overload we live today. I get the need of that for several services that are convenient to rent rather than to own or create by ourselves, but I think this went way too far. One of the beauties of knowing how to write code, is to have the capacity of doing so for yourself. I've been paying a few bucks every month for a solution for a quite simple problem: task management. I guess now everybody has done their own todo list app but me. My requirement is quite simple: I want to list my tasks and appointments in natural language, English or Spanish, with typos and just get the reminder on time. That's it. Sounds something quite stupid for a guy who knows how to code and lives in the third-world to pay for.

## Meet MIA: My WhatsApp AI Assistant

This sounded like a cool side-project to try on LLM services online. Say hello to **MIA**: a deeply lazy name for My AI assistant. It is a WhatsApp based chatbot that I just text or send an audio message to with my weekly planning and other stuff on the go and it texts me reminders for each one on the scheduled date.

Here's what a typical interaction looks like:

```
Me: "Hey MIA, remind me to call mom tomorrow at 3pm 
    and buy groceries on Friday morning"

MIA: "Got it! I've scheduled:
📞 Call mom - Tomorrow 3:00 PM
🛒 Buy groceries - Friday morning
I'll remind you for both!"
```

For querying:

```
Me: What am i supposed to do tomorrow?
MIA: You have to do nothing tomorrow, dude.
```


This has been a classical problem for NLP, with frustrating solutions that force you to use regular expressions and/or relying in classical machine learning with "acceptable" results. But acceptable is not acceptable enough when you are organising part of your life with this tech. So enter the LLMs we have today.

## The Technical Stack Behind MIA

### Frontend: Why WhatsApp Beats Custom Apps

No UI for me. I am tired of installing apps for silly stuff. With the upcoming of these huge models, I don't see longer the need of having an app for a simple use case as mine. I want to interact with it via text or ideally audio. As any US alien would know, WhatsApp is pretty much installed in every person worldwide (except maybe Chinese or Americans), and at the moment I don't mind Zuckerberg knowing what's my supermarket list and when I need to go to the dentist.

**Key advantages:** Universal adoption (2+ billion users), built-in voice message, media and location support, no app installation required, and cross-platform compatibility.


### Backend: FastAPI + Python for Rapid Development

Python with FastAPI. I know I want to sharpen my quite rusty Python skills and a good way to do so is to adopt the language back. Since it's also been some time since I don't write a backend, I thought a good idea is to try to adopt one new skill at the time and my Python skills are rusty but not totally crap.

### AI Layer: OpenAI APIs vs Open Source Models

At the moment I am calling OpenAI APIs for message interpretation and audio transcription but nothing stops me from using open source models. Since we are using Python, there's a nice library for actually creating Agents with structured outputs and function calling: Meet [Pydantic AI](https://ai.pydantic.dev/).

**Current setup:** Text Processing (GPT-4 for natural language understanding), Audio Transcription (Whisper API for voice messages), Task Scheduling (Custom Python scheduler service with timezone handling), and Message Delivery (WhatsApp Business API integration).


### Costs:

Backend Services: I am running everything in a home-lab server. I am actually running two instances, a staging/dev instance and a prod one. Using Cloudflare's zero trust reverse proxy thingy. Hey since I don't mind Mark Zuckerberg spying on me why would I mind about a lavalamp operated company right? ... Right?

WhatsApp Usage: So, there's a trick you can employ to not pay for WhatsApp conversations. If the conversation is started by the user (me), you have 24h to chat without paying a dime. So far, I've been using this tool daily so no charges for me yet.

OpenAI: This is the "largest" expense. I am loading my account as I go, but so far I've spent 10 bucks while using this myself, and some friends in a few months. I have a spare GPU I've used before for CNN training laying around somewhere, I may install it in a local server and sayonara OpenAI sometime soon. 

## Implementation Lessons Learned

First of all. This is not something hard to do. I know the silly CRUD functionality is not something will put me in the James Dean level but hey, your little mini Jarvis is something completely valid and important to do. With that said there were some cool decisions and little things to solve in the meantime. 

**Challenges I encountered:** 
1. **Timezone Handling**: I travel, context matters
2. **I want recurrent tasks**: Some things happen within certain timeframes.
3. **Do more stuff with this:** Why limit this to tasks and reminders?  
4. **I want to query in NL:** So, just asking `what am i supposed to do tomorrow?` has way less friction that any other kind of UX as I see it. 

**Solutions that worked:** First, since WhatsApp doesn't seem to provide timezone of the received text, I have had to make the user let the backend know its timezone. Not the cleanest way, but sending a `/tz` message will prompt the backend to request the User's location and infer the right day and time for where the user is located. Second, there are ways to manage recurrent dates. I managed to use time interval string representations to be able to create recurrent tasks, so something like `Every last month's day i need to balance out the month and prepare next month's expenses` works like a charm :) Third, I immediately noticed I created something useful. While I don't like being in WhatsApp that much, I can't hold other people to send me articles and things to read, and at least for me, the internet is a more distracting world than a text messaging tool, so with forwarding the article preceded or finishing with a `/leer` (or `/read`) I just read the message in the conversation with my lovely chatbotty. Finally, thanks to Pydantic AI functions (kinda of a precursor of MCPs) you can feed your agent with function references it can call to retrieve info, query a db (as it is for this case), and/or perform other service calls. This is quite important and simple to see in action if you don't want to mess with MCPs to start.

## Key points

### Whatsapp Integration
- First of all, you need to create a [Meta & Whatsapp Business Platform app](https://developers.meta.com)
- Follow the instructions and enable Whatsapp. I bought a prepaid SIM card just for this. (I actually bought two, one for dev and other for prod, not a bad idea if you plan to share this with friends and family). 
- You will need to enable Whatsapp and Webhooks products. For webhooks, enable Whatsapp Business Account, you will need to setup here the URL of the verification webhook of your server. 
- Once everything is laid down in the Meta's website, grab this:

    - Verify Token
    - Access Token
    - Phone Number Id

- For the webhook verification you will need to lay down something like this in your backend. Remember to add the URL of this endpoint in the Meta's site:

```python
@router.get("/webhook")
async def verify_webhook(
        hub_mode: str = Query(None, alias="hub.mode"),
        hub_verify_token: str = Query(None, alias="hub.verify_token"),
        hub_challenge: str = Query(None, alias="hub.challenge")):
    """
    Handle webhook verification from WhatsApp.
    This endpoint is called by WhatsApp when setting up the webhook.
    """

    if not hub_mode or not hub_verify_token:
        raise HTTPException(status_code=400, detail="Missing parameters")

    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        logger.info("Webhook verified successfully")
        try:
            challenge = int(hub_challenge)
            return challenge
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid challenge value")

    raise HTTPException(status_code=403, detail="Verification failed")

```

- Now you are ready to receive messages:

```python
@router.post("/webhook")
async def webhook(request: Request, background_tasks: BackgroundTasks,):
    try:
        body = await request.json()

        if not body.get("object"):
            return {"status": "unknown notification type"}

        entry = body.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})

        if "messages" not in value:
            return {"status": "not a message notification"}

        message = value["messages"][0]
        
        sender_profile = value.get("contacts", [])[0].get("profile", {})
        sender_name = sender_profile.get("name", "")
        
        # I enqueue the message for processing in the background. 
        # There's a message router that will check on the sender, message type 
        # to route it as a:
        # 1. TXT message -> Goes to the LLM or Command parser (if begins with '/')
        # 2. Audio Message -> Gets the resource (Downloads the audio message) 
        #       and then goes to OpenAI's whisper API for transcription
        #       to later be processed as a TXT message.
        # 3. Location -> I need this for TZ inference to be used for notifications.
        background_tasks.add_task(MessageRouter.route, message, sender_name)

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {"status": "error", "message": str(e)}
```

- To send messages, I do it as a background task and manage long texts for article reading, 
but the method actually looks something like:

```python
    async def send_whatsapp_message(to: str, 
                                    message: str,
                                    interactive_content: Optional[dict] = None
                                    ) -> bool:

        url = f"https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        
        # Base de datos para todos los mensajes
        data = {
            "messaging_product": "whatsapp",
            "to": to,
        }
        
        # Si hay contenido interactivo, usarlo
        if interactive_content:
            data["type"] = "interactive"
            data["interactive"] = interactive_content
        else:
            # Enviar mensaje de texto normal
            data["type"] = "text"
            data["text"] = {"body": message}

        try:
            # Create a new client for each background task
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                response.raise_for_status()
                logger.info(f"Message sent successfully to {to}")
                return True
        except httpx.HTTPStatusError as exc:
            try:
                error_details = exc.response.json()
            except Exception:
                error_details = exc.response.text
            logger.error(
                f"Error HTTP {exc.response.status_code} al enviar el mensaje: {error_details}"
            )
            return False
        except Exception as e:
            logger.error(f"Error inesperado al enviar el mensaje: {e}")
            return False
```

Interactive content is required to request the User's location for TZ.

### Pydantic AI

- To force an Agent to get an structured output, you can leverage on Pydantic's AI framework. This way you can force the output of the Agent/LLM to fit in a certain Pydantic Model. In my case something like this:

```python
class MessageInterpretation(BaseModel):
    model_config = {
        "arbitrary_types_allowed": True
    }
    
    inferred_tasks: Optional[List[TaskInterpretation]] = None
    inferred_recurrent_tasks: Optional[List[RecurrentTaskInterpretation]] = None
    inferred_queries: Optional[QueryInterpretation] = None

    reply_message: Optional[str] = None
    reply_to_queries: Optional[str] = None
    reply_to_tasks: Optional[str] = None
    reply_to_recurrent_tasks: Optional[str] = None

class TaskInterpretation(BaseModel):
    name: Optional[str] = None
    datetime_start: Optional[datetime.datetime] = None
    datetime_end: Optional[datetime.datetime] = None
    inferred_task_type : Optional[TaskType] # None, PERSONAL, WORK
    priority: Optional[TaskPriority] = None
    hashtags : Optional[list[str]]
    
    should_remind: bool = False
    reminder_datetime: Optional[datetime.datetime] = None

```

There are other objects there as you can see in this snippet. I just don't want to make this post too dense, but here you see where the bullets are being shot.

When you call the Agent (just do this following the Pydantics documentation) you have to define the expected output models and tools:

```python
...
        # Create tools with the wrapper functions
        tools = [
            Tool(
                name="get_tasks_for_dates_tool",
                function=get_tasks_wrapper,
                description="Get tasks within a date range"
            ),
            Tool(
                name="select_tool",
                function=select_query_wrapper,
                description="Execute a SQL query"
            ),
            Tool(
                name="db_schema_tool",
                function=get_schema_wrapper,
                description="Get database schema"
            )
        ]

        try:
            agent = Agent(
                model=model,
                output_type=MessageInterpretation,
                system_prompt=PROMPT,
                tools=tools
            )
        except Exception as e:
            print(f"Error creating agent: {e}")
            raise
        
        ...

        try:
            response: AgentRunResult[MessageInterpretation] = await agent.run(message)
            return response.output
        except UnexpectedModelBehavior as e:
            print(f"Unexpected model behavior: {e}")
            raise
        except Exception as e:
            raise
...
```

Those tools defined are just python functions that the Agent has access to to retrieve information to conform an answer.

### Putting It All Together

With these key components (WhatsApp webhook handling, Pydantic AI structured outputs, and database tools), you have everything needed to build your own intelligent assistant. The beauty is in how these pieces work together: WhatsApp handles the user interface, Pydantic AI interprets natural language and structures the data, and the tools let your assistant actually *do* things rather than just chat.

The whole system becomes surprisingly capable once you connect these dots. What started as a simple task reminder has evolved into something that can read articles, handle complex recurring schedules, and query your data in natural language.

## What's Next for MIA

Current features are just the beginning. Planned improvements include open sourcing the project (I did not do this for the money, I may open it up and charge for hosting service here for people who may want to or may not know how to setup all the APIs and whatnot, but for the rest of you, I am willing to share this once I know it is not complete crap and, hey, if you need something like this, grab the torch), smart rescheduling (like "Move my 3pm meeting to tomorrow"), and integration expansion (calendar sync, email notifications). I think all of this features seem to be a good starting point to learn some MCP servers. 


## Now it is your turn

If you are feeling lost or bored, this is probably a good way to unbore yourself and to feel good about these skills.

Ready to escape subscription hell? Start with these steps:

1. **Identify Your Pain Point**: What $5-15/month service could you replace?
2. **Start Simple**: Build an MVP that handles one core feature well  
3. **Iterate Based on Usage**: Let real usage patterns guide development
4. **Share Your Results**: Document your journey and help others

**Resources mentioned:**
[FastAPI Documentation](https://fastapi.tiangolo.com/), [Pydantic AI GitHub](https://github.com/pydantic/pydantic-ai), [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp), [OpenAI API Documentation](https://platform.openai.com/docs)

**Contact:**
pablo@datarock.ai


*Follow along as I document MIA's development journey. Next post covers the natural language processing challenges I encountered and how I solved them with structured prompting techniques.*
