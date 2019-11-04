const fsPromises = require('fs').promises
const TelegramBot = require('node-telegram-bot-api')
const Agent = require('socks5-https-client/lib/Agent')

const quotes = require('./quotes.js')

const subscribers_path = 'data/subscribers.json'

const {
    TELEGRAM_TOKEN,
    PROXY_SOCKS5_HOST,
    PROXY_SOCKS5_PORT,
    PROXY_SOCKS5_USERNAME,
    PROXY_SOCKS5_PASSWORD,
} = process.env

if(!TELEGRAM_TOKEN) {
    throw new Error('Please specify TELEGRAM_TOKEN as env variable')
}

if(
    !PROXY_SOCKS5_HOST     ||
    !PROXY_SOCKS5_PORT     ||
    !PROXY_SOCKS5_USERNAME ||
    !PROXY_SOCKS5_PASSWORD
) {
    throw new Error('Please specify PROXY_SOCKS5_HOST, PROXY_SOCKS5_PORT, PROXY_SOCKS5_USERNAME, PROXY_SOCKS5_PASSWORD as env variables')
}

const bot = new TelegramBot(TELEGRAM_TOKEN, {
    polling: true,
    request: {
		agentClass: Agent,
		agentOptions: {
			socksHost: PROXY_SOCKS5_HOST,
			socksPort: parseInt(PROXY_SOCKS5_PORT),
			socksUsername: PROXY_SOCKS5_USERNAME,
			socksPassword: PROXY_SOCKS5_PASSWORD
		}
	}
})

bot.on('message', async msg => {
    const chatId = msg.chat.id
    const {
        username,
        first_name,
        last_name,
    } = msg.chat

    const { text='' } = msg

    if(text.startsWith('/start') || text.startsWith('/subscribe')) {
        const subs = await getSubs()
        subs[chatId] = {
            chatId,
            username,
            first_name,
            last_name,
        }
        await writeSubs(subs)

        bot.sendMessage(
            chatId,
            'ты в игре, жди весточек!\n\nкогда умрешь, используй команду /unsubscribe, чтобы отписаться',
            {
                parse_mode: 'Markdown'
            }
        )

        return
    } else if(text.startsWith('/unsubscribe')) {
        const subs = (
            await getSubs()
        )

        delete subs[chatId]
        
        await writeSubs(subs)

        bot.sendMessage(
            chatId,
            'сегодня ты просто отписан, а завтра можешь быть и отпет¹\n\n\\_\\_\\_\\_\\_\\_\n_[1] это не угроза а просто последнее напоминание ну мало ли_',
            {
                parse_mode: 'Markdown'
            }
        )
    } else {
        bot.sendMessage(
            chatId,
            '*Я Ђᕊl ŢĘҔЯ ÕҔHRᏁ, ӇỢ Я П₽ÕԸƬѺ ҔǾ₮*\n\nесли есть какие-то предложения или желание поболтать, то @kiraind',
            {
                parse_mode: 'Markdown'
            }
        )
    }
})

bot.on('polling_error', (error) => {
    console.log(error)
})

async function getSubs() {
    const json = await fsPromises.readFile(subscribers_path, 'utf-8')

    return JSON.parse(json)
}

async function writeSubs(data) {
    const json = JSON.stringify(data, null, 4)

    await fsPromises.writeFile(subscribers_path, json, 'utf-8')
}

setInterval(async () => {
    const subs = await getSubs()

    for(let chatId in subs) {
        if( Math.random() < 1/(24*60) ) {
            const quote = quotes[
                Math.floor(
                    Math.random() * quotes.length
                )
            ](subs[chatId])

            bot.sendMessage(
                chatId,
                quote,
                {
                    parse_mode: 'Markdown'
                }
            )
        }
    }

    // quotes
}, 60 * 1000)