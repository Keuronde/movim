<li
    id="{$contact->jid|cleanupId}-chat-item"
    data-jid="{$contact->jid}"
    class="
        {if="$roster && $roster->presence"}
            {if="$roster->presence->value > 4"}faded{/if}
            {if="$roster->presence->last > 60"} inactive{/if}
            {if="$roster->presence->capability && $roster->presence->capability->identities()->first() && in_array($roster->presence->capability->identities()->first()->type, ['handheld', 'phone', 'web'])"}
                action
            {/if}
        {/if}
        "
    title="{$contact->jid}{if="isset($message)"} · {$message->published|strtotime|prepareDate}{/if}">
    <span class="primary icon bubble
        {if="$roster && $roster->presence"}status {$roster->presence->presencekey}{/if}
        {if="$contact->locationDistance"} location{/if}
    "
    {if="$count > 0"}data-counter="{$count}"{/if}
    >
        <img src="{if="$roster"}{$roster->getPicture('o')}{else}{$contact->getPicture('o')}{/if}">
    </span>

    <div>
        <p class="normal line">
            {if="isset($message)"}
                <span class="info">
                    {$message->published|strtotime|prepareDate:true,true}
                </span>
            {/if}
            {if="isset($message)"}
                <span class="info" title="{$message->published|strtotime|prepareDate}">
                    {if="$message->jidfrom == $message->user_id"}
                        {if="$message->displayed"}
                            <span class="material-icons">done_all</span>
                        {elseif="$message->delivered"}
                            <span class="material-icons">check</span>
                        {/if}
                        &nbsp;
                    {/if}
                </span>
            {/if}
            {if="$roster"}
                {$roster->truename}
            {elseif="strpos($contact->jid, '/') != false"}
                {$exploded = explodeJid($contact->jid)}
                {$exploded.resource}
                <span class="second" title="{$exploded.jid}">
                    {$exploded.jid}
                </span>
            {else}
                {$contact->truename}
            {/if}

            {if="$roster && $roster->presence && $roster->presence->capability"}
                <span class="second" title="{$roster->presence->capability->name}">
                    <i class="material-icons">{$roster->presence->capability->getDeviceIcon()}</i>
                </span>
            {/if}
        </p>
        {if="$status"}
            <p class="line">{$status}</p>
        {elseif="isset($message)"}
            {if="$message->retracted"}
                <p><i class="material-icons">delete</i> {$c->__('message.retracted')}</p>
            {elseif="$message->encrypted"}
                <p><i class="material-icons">lock</i> {$c->__('message.encrypted')}</p>
            {elseif="$message->type == 'invitation'"}
                <p><i class="material-icons icon gray">outgoing_mail</i> {$c->__('message.invitation')}</p>
            {elseif="$message->type == 'jingle_incoming'"}
                <p><i class="material-icons icon green">call</i> {$c->__('chat.jingle_incoming')}</p>
            {elseif="$message->type == 'jingle_retract'"}
                <p><i class="material-icons icon gray">phone_missed</i> {$c->__('chat.jingle_retract')}</p>
            {elseif="$message->type == 'jingle_reject'"}
                <p><i class="material-icons icon orange">phone_missed</i> {$c->__('chat.jingle_reject')}</p>
            {elseif="$message->type == 'jingle_outgoing'"}
                <p><i class="material-icons icon blue">call</i> {$c->__('chat.jingle_outgoing')}</p>
            {elseif="$message->type == 'jingle_end'"}
                <p><i class="material-icons icon red">call_end</i> {$c->__('chat.jingle_end')}</p>
            {elseif="$message->file"}
                <p>
                    {if="$message->jidfrom == $message->user_id"}
                        <span class="moderator">{$c->__('chats.me')}:</span>
                    {/if}
                    {if="typeIsPicture($message->file['type'])"}
                        <i class="material-icons">image</i> {$c->__('chats.picture')}
                    {elseif="typeIsAudio($message->file['type'])"}
                        <i class="material-icons">equalizer</i> {$c->__('chats.audio')}
                    {elseif="typeIsVideo($message->file['type'])"}
                        <i class="material-icons">local_movies</i> {$c->__('chats.video')}
                    {else}
                        <i class="material-icons">insert_drive_file</i> {$c->__('avatar.file')}
                    {/if}
                </p>
            {elseif="stripTags($message->body) != ''"}
                <p class="line">
                    {if="$message->jidfrom == $message->user_id"}
                        <span class="moderator">{$c->__('chats.me')}:</span>
                    {/if}
                    {autoescape="off"}
                        {$message->body|stripTags|addEmojis}
                    {/autoescape}
                </p>
            {/if}
        {elseif="$roster && $roster->presence && $roster && $roster->presence->status"}
            <p class="line">{$roster->presence->status}</p>
        {/if}
    </div>
</li>
