interface ChannelStore<T> {
    isLoading: boolean
    isDone: boolean
    error: string
    data: T
}

interface Device {
    name: string
}

interface Scanner {
    name: string
}
