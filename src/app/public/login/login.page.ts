import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  username = "";
  password = "";
  domain = "";
  logo = "assets/logo.jpg";

  constructor(private authService: AuthenticationService, private storage: Storage) { }

  ngOnInit() {
    this.storage.get("domain").then(res => {
      this.domain = res;
    });
    //this.authService.checkToken();
  }

  login() {
    this.authService.login(this.username, this.password, this.domain);
  }
}
