import { Component, OnInit } from '@angular/core';
import { ModalController, PopoverController, Platform, LoadingController, AlertController, ActionSheetController } from '@ionic/angular';
import { SettingsPage } from '../settings/settings.page';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FilterPage } from '../filter/filter.page';
import { DocumentViewer } from '@ionic-native/document-viewer/ngx';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
})
export class PaymentsPage implements OnInit {

  vendors = [];
  payments = [];
  skeletonText = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  userID;
  token;
  domain;
  corpID = "0x000000000000000000000000000000000000";
  vendorID = "0x000000000000000000000000000000000000";
  corpName = "";
  data = true;
  loading;
  loadingDismissed = false;

  constructor(private modalController: ModalController, private storage: Storage, public http: HttpClient, private popoverController: PopoverController, private loadingController: LoadingController,
    private platform: Platform, private file: File, private fileOpener: FileOpener, private fileTransfer: FileTransfer, private documentViewer: DocumentViewer, private alertController: AlertController, public actionSheetController: ActionSheetController) { }

  ngOnInit() {
    // get userID and token
    this.storage.get("userID").then(res => {
      this.userID = res;
    });
    this.storage.get("auth-token").then(res => {
      this.token = res;
    });
    this.storage.get("domain").then(res => {
      this.domain = res;
    });
    this.storage.get("selectedCorp").then(res => {
      this.corpID = res.id;
      this.corpName = res.name;
      if (this.corpName != "All Hotels") {
        this.getAllBills();
      } else {
        this.corpName = "";
      }
    });
  }

  async openSettings() {
    const modal = await this.modalController.create({
      component: SettingsPage,
    });
    modal.onDidDismiss().then((dataReturned) => {
      if (dataReturned !== null) {
        if (dataReturned.data) {
          console.log('Modal Sent Data :', dataReturned.data);
          // TODO: update internal storage with new settings
        }
      }
    });
    return await modal.present();
  }

  getAllBills () {
    this.data = false;
    this.payments = [];
    this.vendors = [];

    var url = 'https://mobileapi.nimbleproperty.net/api/Data/BillInfo';
    var data = {
      CorpID: this.corpID,
      VendorID: this.vendorID,
      Domain: this.domain
    }
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'UserID': this.userID,
      'Token': this.token,
      'Domain': this.domain,
      'MyClientCert': '',        
      'MyToken': ''
    });
    let options = {
      headers: httpHeaders
    };
    this.http.post(url, data, options).subscribe((response) => {
      console.log(response);
      var paymentInfo = [];
      for (var key in response) {
        var index = response[key].splits.indexOf(". ");
        if (index > -1) {
          response[key].splits = response[key].splits.substring(index + 2);
        }
        paymentInfo.push(response[key]);
      }
      paymentInfo.sort(this.compare);
      
      var previousName = "";
      var tempArr = [];
      for (var i = 0; i < paymentInfo.length; i++) {
        if (paymentInfo[i].name == previousName) {
          tempArr.push(paymentInfo[i]);
        } else {
          if (tempArr.length != 0) {
            this.payments.push(tempArr);
          }
          tempArr = [paymentInfo[i]]
          previousName = paymentInfo[i].name;
          this.vendors.push(previousName);
        }
      }
      if (tempArr.length != 0) {
        this.payments.push(tempArr);
      }
      this.data = true;
    });
  }

  compare(a, b) {
    if (a.name < b.name){
      return -1;
    }
    if (a.name > b.name){
      return 1;
    }
    return 0;
  }

  approvePayment(paymentID) {
    var url = 'https://mobileapi.nimbleproperty.net/api/Data/ApproveOrDenyBill';
    var data = {
      PaymentID: paymentID,
      PaymentType: 1,
      Domain: this.domain
    }
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'UserID': this.userID,
      'Token': this.token,
      'Domain': this.domain,
      'MyClientCert': '',        
      'MyToken': ''
    });
    let options = {
      headers: httpHeaders
    };
    this.http.post(url, data, options).subscribe((response) => {
      this.getAllBills();
    });
  }
  denyPayment(paymentID) {
    var url = 'https://mobileapi.nimbleproperty.net/api/Data/ApproveOrDenyBill';
    var data = {
      PaymentID: paymentID,
      PaymentType: 2,
      Domain: this.domain
    }
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'UserID': this.userID,
      'Token': this.token,
      'Domain': this.domain,
      'MyClientCert': '',        
      'MyToken': ''
    });
    let options = {
      headers: httpHeaders
    };
    this.http.post(url, data, options).subscribe((response) => {
      this.getAllBills();
    });
  }

  // code for filter by corp/brand/portfolio
  async openPopover(ev: Event) {
    const popover = await this.popoverController.create({
      component: FilterPage,
      componentProps: {
        page: 'payments'
      },
      event: ev
    });
    popover.onDidDismiss().then((dataReturned) => {
      if (dataReturned !== null) {
        if (dataReturned.data) {
          this.corpID = dataReturned.data.id;
          this.corpName = dataReturned.data.name;
          console.log(this.corpID);
          this.storage.set("selectedCorp", {name: this.corpName, id: this.corpID});
          this.getAllBills();
        }
      }
    });
    return await popover.present();
  }

  openPDF (downloadPath) {
    console.log(downloadPath);
    if (downloadPath != "") {
      this.showLoading();
      let downloadUrl = downloadPath;
      let path = this.file.dataDirectory;
      const transfer = this.fileTransfer.create();
      var today = new Date();
      let fileExtn = downloadUrl.split('.').reverse()[0];
      console.log(fileExtn);
      let fileMIMEType = this.getMIMEtype(fileExtn);
      
      transfer.download(downloadUrl, path + today.toISOString()).then(entry => {
        let url = entry.toURL();
      
        /*if (this.platform.is('ios')) {
          this.documentViewer.viewDocument(url, fileMIMEType, {});
          this.dismissLoading();
        } else {
          this.fileOpener.open(url, fileMIMEType)
            .then(() => this.dismissLoading())
            .catch(e => this.dismissLoading());
        }*/
        this.platform.ready().then(()=>{
          this.fileOpener.open(url, fileMIMEType)
            .then(() => this.dismissLoading())
            .catch(e => this.showAlert(e));
        });
      });
    }
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

  async showAlert(message) {
    const alert = await this.alertController.create({
      header: 'Login Failed',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  getMIMEtype(extn){
    let ext=extn.toLowerCase();
    let MIMETypes={
      'txt' : 'text/plain',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc' : 'application/msword',
      'pdf' : 'application/pdf',
      'jpg' : 'image/jpeg',
      'bmp' : 'image/bmp',
      'png' : 'image/png',
      'xls' : 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'rtf' : 'application/rtf',
      'ppt' : 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
    return MIMETypes[ext];
  }

  async presentActionSheet(payment) {
    payment.downLoadPath1 = payment.downLoadPath1.trim();
    payment.downLoadPath2 = payment.downLoadPath2.trim();
    payment.downLoadPath3 = payment.downLoadPath3.trim();
    payment.downLoadPath4 = payment.downLoadPath4.trim();
    payment.downLoadPath5 = payment.downLoadPath5.trim();
    payment.downLoadPath6 = payment.downLoadPath6.trim();
    if (payment.downLoadPath1 != "") {
      var buttons = [];
      if (payment.downLoadPath1 != "") {
        var lastslashindex = payment.downLoadPath1.lastIndexOf('/');
        buttons.push({
          text: payment.downLoadPath1.substring(lastslashindex  + 1),
          handler: () => {
            this.openPDF(payment.downLoadPath1);
          }
        });
      }
      if (payment.downLoadPath2 != "") {
        var lastslashindex = payment.downLoadPath2.lastIndexOf('/');
        buttons.push({
          text: payment.downLoadPath2.substring(lastslashindex  + 1),
          handler: () => {
            this.openPDF(payment.downLoadPath2);
          }
        });
      }
      if (payment.downLoadPath3 != "") {
        var lastslashindex = payment.downLoadPath3.lastIndexOf('/');
        buttons.push({
          text: payment.downLoadPath3.substring(lastslashindex  + 1),
          handler: () => {
            this.openPDF(payment.downLoadPath3);
          }
        });
      }
      if (payment.downLoadPath4 != "") {
        var lastslashindex = payment.downLoadPath4.lastIndexOf('/');
        buttons.push({
          text: payment.downLoadPath4.substring(lastslashindex  + 1),
          handler: () => {
            this.openPDF(payment.downLoadPath4);
          }
        });
      }
      if (payment.downLoadPath5 != "") {
        var lastslashindex = payment.downLoadPath5.lastIndexOf('/');
        buttons.push({
          text: payment.downLoadPath5.substring(lastslashindex  + 1),
          handler: () => {
            this.openPDF(payment.downLoadPath5);
          }
        });
      }
      if (payment.downLoadPath6 != "") {
        var lastslashindex = payment.downLoadPath6.lastIndexOf('/');
        buttons.push({
          text: payment.downLoadPath6.substring(lastslashindex  + 1),
          handler: () => {
            this.openPDF(payment.downLoadPath6);
          }
        });
      }
      buttons.push({
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
      });

      const actionSheet = await this.actionSheetController.create({
        header: 'View Attatchment',
        buttons: buttons
      });
      await actionSheet.present();
    }
  }

  handleElement (path) {
    console.log(path);
  }
}
