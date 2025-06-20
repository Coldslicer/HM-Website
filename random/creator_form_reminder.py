import discord, json, os
from discord import Forbidden, Guild, Intents, Member
from discord.ext.commands import Bot
from typing import List, Optional
from dotenv import load_dotenv

# Load env
load_dotenv()
token: str = os.getenv("BOT_TOKEN")

# Setup bot
intents: Intents = Intents.default()
intents.members = True
intents.guilds = True

bot: Bot = Bot(command_prefix="!", intents=intents)

# Data
usernames: List[str] = [".239", ".element.", ".zova8", "2sayt", "_cynthian", "_fenwick", "a_fellow_joe", "aarav_p30", "ab9091", "adrienss", "agnisbad", "alphamc", "arayzia", "archiemc", "astrox3d", "austyt", "awpenheimerr", "banana180069", "bbrothers124", "beavergeography", "blametruthyt", "bloohbusiness", "bocaj930", "bret1111", "bucklesss", "c1ous3r", "calebissalty", "cdiiinky", "chefanth", "choctopus", "coldslicer", "connorjaiye", "coolgamer33", "crave__", "curlynaps", "cxsmxc", "cypherinreallife", "dackfive", "dan7eh", "danieltrox", "dauntusgaming", "dc_playz", "dewier2", "diego_real_escape", "diorods", "dipsler", "disruptive", "dylpickleyt", "eazycomputersolutions", "eturbo", "ex0t1c9745", "fan19", "finni6732", "flimsynimsy", "floatingkoala", "flowtives", "fpp_tech", "frediiiest", "fredthedoggy", "gamesettings", "gamingwithkristi", "gorillo", "haydenjohnsonyt", "hotslicer", "hotslicermedia", "humoky", "instantava", "intergta", "issamezany", "itzowo", "ivoltex", "jasetheace37", "jcutty", "jimdoga", "joey12372", "jooonah", "jordanashmedia", "judelosasso", "k.2241", "keizz", "kompv", "kyleisamazing", "lauri", "legendanthony_yt", "legitmysh", "ligeriscool", "lilyawna", "limitless745", "lndominuss", "lolfrosty", "louisdepoui", "love_panda_", "macotacomc", "madd_mike.", "magzbem", "malcom008", "maximus_thegreat", "meanob", "mind0", "minnox", "mominelham", "mossivalorant", "mr_buush", "muffinatorman", "n0ted1", "nacli", "necronm", "nexusbliss", "nikoyaps", "nimanoice", "notvix", "novvvvva", "nullcmdval", "ottr.", "perfectlyrational_14358", "pixelrookie", "princevidz", "puncc", "r7bbie", "raghavsinha08", "ratknight.", "rawzu", "realgage", "reckonerxz", "recoilgaming", "rehtycs.", "remf1003", "robokast", "sebbyk", "secretbuilds", "shalz.", "sheranom_yt", "silentlol", "silkyspidey", "simpleflips", "simracingcorner", "skyfall9959", "sondo301", "spaceantiquity", "squeegeeful", "starthorkbusiness", "summitshortss", "sushijams", "tahliaaj", "tamura77", "tartano", "tbanj", "tbchd", "teetstv", "tgtkai", "thatboyarctic", "thedangleberries", "thehorizonmc", "theobaldthebird", "theomonty", "thestarbazaar", "thomas_33306", "tnsix", "toadstar0", "tommisgaming", "trollerninja", "tropsplays", "turtlenation4720", "twist2op", "unsorted_guy", "urnotjustin", "valorreviews_72426", "vimeanaj", "vincentsmgunbanned", "vitalasy", "vitalcs2", "voiceoverpete", "waasephi", "westjett", "whatdarrenplays", "whimzeeyt", "wilsoncs2", "wm0359", "wynger", "xxxnolimitzz", "yfury", "yobruz", "zenithmc", "zetro.", "zyphon", "zypic."]
server_id: int = 1247307161512706159

# Message text
text: str = (
    "Hi {mention},\n\n"
    "We noticed that we still don't have your sponsorship data on file for Hotslicer Media.\n\n"
    "Could you fill out this form? https://forms.gle/s573MEVZsFmEaEgP9 \n\n"
    "We need this because sponsors require it when choosing creators. "
    "Without it we can't get you sponsorships.\n\n"
    "Please fill this out asap!\n\n"
    "(Sorry if this message has been sent multiple times, we are having issues with the server disconnecting the bot)\n\n"
    "Thanks!\n"
    "Hotslicer Media"
)

@bot.event
async def on_ready() -> None:
    print("Bot is ready.")
    
    guild: Optional[Guild] = bot.get_guild(server_id)
    if guild is None:
        print(f"Invalid server: {server_id}.")
        return

    # Map usernames to members
    found = []
    unfound = set(usernames)

    # Already sent users
    try:
        with open("sent.json", "r") as f:
            sent = set(json.load(f))
    except FileNotFoundError:
        sent = set()

    # Fetch members
    print("Fetching members...")
    async for member in guild.fetch_members(limit=None):
        if member.name in unfound:
            found.append(member)
            unfound.remove(member.name)

    for member in found:
        if member.id in sent:
            continue
        sent.add(member.id)

        # Save already sent
        with open("sent.json", "w") as f:
            json.dump(list(sent), f)
        
        try:
            message: str = text.format(mention=member.mention)
            await member.send(message)
            print(f"✅ Sent to {member.name} ({member.id})")
        except Forbidden:
            print(f"❌ Cannot DM {member.name} ({member.id}) — DMs disabled or bot blocked.")
        except Exception as e:
            print(f"⚠️ Error sending to {member.name} ({member.id}) - {e}")

    # Report usernames not found
    if unfound:
        print("\nUnresolved usernames:")
        for name in unfound:
            print(f" - {name}")

    await bot.close()

# Run the bot
bot.run(token)
