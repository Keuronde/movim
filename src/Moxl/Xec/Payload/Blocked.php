<?php

namespace Moxl\Xec\Payload;

use App\Reported;

class Blocked extends Payload
{
    public function handle(?\SimpleXMLElement $stanza = null, ?\SimpleXMLElement $parent = null)
    {
        $jid = (string)$stanza->item->attributes()->jid;

        $r = Reported::firstOrCreate(['id' => $jid]);
        \App\User::me()->reported()->syncWithoutDetaching([$r->id => ['synced' => true]]);
        \App\User::me()->refreshBlocked();

        $this->pack($jid);
        $this->deliver();
    }
}
