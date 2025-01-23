return {
    topic: (msg.topicMain === 'start') ? 'start' : 'update',
    time: new Date(),
    _msgid: msg._msgid
};