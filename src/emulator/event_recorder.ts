export const 
  REG_READ = 1,
  REG_WRITE = 2,
  MEM_READ  = 3,
  MEM_WRITE = 4,

  TTYOUT    = 100,
  PRINT     = 102,
  TRAP      = 103


  type Event = [ string, any[]]
type EventList = Event[]

export class EventRecorder {

  eventList: EventList = []

  constructor() {
    this.reset()
  }

  reset() {
    this.eventList = []
  }


  record(type: string, args: any[]) {
    console.log(`record`, type, args)
    this.eventList.push([ type, args ])
  }
}
