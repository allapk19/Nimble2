import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Platform, AlertController, LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';


const TOKEN_KEY = 'auth-token';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  authenticationState = new BehaviorSubject(false);
  loading;
  loadingDismissed = false;

  constructor(private storage: Storage, private plt: Platform, public http: HttpClient, public alertController: AlertController, public loadingController: LoadingController) {
    this.checkToken();
  }

  // check if user is already logged in from before
  checkToken() {
    this.storage.get(TOKEN_KEY).then(res => {
      if (res) {
        this.authenticationState.next(true);
      }
    })
  }

  login(username, password, domain: string) {
    this.showLoading();

    var url = 'https://mobileapi.nimbleproperty.net/api/Active/UserLogin';
    //var url = 'http://' + domain + '/api/Active/UserLogin';
    var data = {
      UserName: username,
      Password: password,
      Domain: domain
    }
    let httpHeaders = new HttpHeaders({
      'content-type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Domain': domain,
      'MyClientCert': '',        
      'MyToken': ''
    });
    let options = {
      headers: httpHeaders
    };

    this.http.post(url, data, options).subscribe((response) => {
      console.log(response);
      if (response["userID"]) {
        this.storage.set(TOKEN_KEY, response["token"]);
        this.storage.set("userID", response["userID"]);
        this.storage.set("domain", domain.trim());
        this.authenticationState.next(true);
      } else {
        this.dismissLoading();
        this.showAlert('The username, password, or domain was incorrect');
      }
    }, error => {
      console.log(error);
      this.dismissLoading();
      this.showAlert(JSON.stringify(error.message));
    });
  }

  logout() {
    this.storage.remove(TOKEN_KEY);
    this.storage.remove('salesSettings');
    this.storage.remove('unapproved');
    this.storage.remove('userID');
    this.authenticationState.next(false);
  }

  // check if user is logged in
  isAuthenticated() {
    return this.authenticationState.value;
  }

  async showAlert(message) {
    const alert = await this.alertController.create({
      header: 'Login Failed',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async showLoading() {
    this.loading = await this.loadingController.create({
      message: 'Loading...',
      duration: 10000
    });
    await this.loading.present();
    if (this.loadingDismissed) {
      this.loadingDismissed = false;
      await this.loading.dismiss()
    }
  }
  async dismissLoading() {
    this.loadingDismissed = true;
    this.loading.dismiss();
  }

}
