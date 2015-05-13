
import {Component, View, bootstrap} from 'angular2/angular2';


@Component({
  selector: 'app'
})
@View({
  inline: '<div>{{msg}}</div>'
})
export class App {
  msg: string;

  constructor() {
      this.msg = 'Hello World!!!';
  }
}

bootstrap(App);
