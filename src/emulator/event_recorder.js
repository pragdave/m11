export const 
  REG_READ = 1,
  REG_WRITE = 2,
  MEM_READ  = 3,
  MEM_WRITE = 4,

  TTYOUT    = 100,
  PRINT     = 102,
  TRAP      = 103


export class EventRecorder {

  constructor() {
    this.reset()
  }

  reset() {
    this.eventList = []
  }


  record(type, args) {
    console.log(`record`, type, args)
    this.eventList.push([ type, args ])
  }
}
