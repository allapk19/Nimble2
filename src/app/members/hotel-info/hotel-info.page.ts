import { Component, OnInit } from '@angular/core';
import { PopoverController, ModalController } from '@ionic/angular';
import { FilterPage } from '../filter/filter.page';
import { SettingsPage } from '../settings/settings.page';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-hotel-info',
  templateUrl: './hotel-info.page.html',
  styleUrls: ['./hotel-info.page.scss'],
})
export class HotelInfoPage implements OnInit {

  tabs = [
    {name: 'WTD', active: true, value: 1},
    {name: 'MTD', active: false, value: 2},
    {name: 'QTD', active: false, value: 5},
    {name: 'YTD', active: false, value: 3},
    {name: 'Daily', active: false, value: 4}
  ];
  type = "corp";
  settings;
  userID;
  token;
  domain;
  tabVal = 1;
  toDate: string;
  fromDate: string;
  myDate;
  data = false;
  otherData = false;

  salesSections = [];
  otherSections = [
    {name: "Total Bank Balance", value: 0, currency: '$'},
    {name: "Total Payables", value: 0, currency: '$'},
    {name: "Total Receivables", value: 0, currency: '$'},
    {name: "AVG STR INDEX (MPI)", value: 0, currency: ' '},
    {name: "AVG INDEX (ARI)", value: 0, currency: ' '},
    {name: "AVG INDEX (RGI)", value: 0, currency: ' '},
    {name: "AVG GSS", value: 0, currency: ' '},
    {name: "AVG Key Driver", value: 0, currency: ' '},
    {name: "Total Comments", value: 0, currency: ' '},
  ];
  skeletonText = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  selectedOption;
  corpID;

  shortenedNames = [
    {original: "Food and Beverages Department", shortened: "F&B Revenue"},
    {original: "Other Operating Department", shortened: "Other Op"},
    {original: "Room Department", shortened: "Room Revenue"},
    {original: "Occupancy %", shortened: "Occupancy"}
  ]
  initialized = false;
  falseSettings = [];
  unapproved = 0;
  allHotelInfo = [];
  skeleton = [1, 2, 3]

  constructor(private popoverController: PopoverController, private modalController: ModalController, private storage: Storage, public http: HttpClient) { }

  ngOnInit() {

    // get userID, token, domain, corp
    this.storage.get("userID").then(res => {
      this.userID = res;
      this.storage.get("auth-token").then(res2 => {
        this.token = res2;
        this.storage.get("domain").then(res3 => {
          this.domain = res3;
          this.storage.get("selectedCorp").then(res4 => {
            this.corpID = res4.id;
            this.selectedOption = res4.name;
            if (!this.initialized) {
              this.getHotelInformation(this.userID, this.token, this.corpID, this.tabVal);
              this.initialized = true;
            }
          });
        });
      });
    });

    if (!this.initialized) {
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      this.toDate = yyyy + "-" + mm + "-" + dd;
      this.myDate = today.toISOString();
      this.getFromDate(1);
    }

    // get settings
    this.storage.get("salesSettings").then(res => {
      if (res) {
        this.falseSettings = res.filter(obj => {
          return obj.value == false;
        });
        this.storage.get("unapproved").then(res => {
          if (res) {
            if (this.unapproved == 0) {
              this.unapproved = 1;
              this.getHotelInformation(this.userID, this.token, this.corpID, this.tabVal);
            }
            this.unapproved = 1;
          } else {
            if (this.unapproved == 1) {
              this.unapproved = 0;
              this.getHotelInformation(this.userID, this.token, this.corpID, this.tabVal);
            }
            this.unapproved = 0;
          }
        });
        // only show info that is turned on in settings
        let hotelInfo = Object.assign([], this.allHotelInfo);
        for (var i = 0; i < this.falseSettings.length; i++) {
          for (var j = 0; j < hotelInfo.length; j++) {
            if (this.falseSettings[i].name == hotelInfo[j].name) {
              hotelInfo.splice(j, 1);
            }
          }
        }
        this.salesSections = hotelInfo;
      }
    });
  }
  
  // update by WTD, MTD, etc
  tabClicked(tab) {
    this.tabs[0].active = false;
    this.tabs[1].active = false;
    this.tabs[2].active = false;
    this.tabs[3].active = false;
    this.tabs[4].active = false;
    tab.active = !tab.active;

    this.tabVal = tab.value;
    this.getHotelInformation(this.userID, this.token, this.corpID, this.tabVal);
  }

  // code for filter by corp/brand/portfolio
  async openPopover(ev: Event) {
    const popover = await this.popoverController.create({
      component: FilterPage,
      componentProps: {
        page: 'hotel-info'
      },
      event: ev
    });
    popover.onDidDismiss().then((dataReturned) => {
      if (dataReturned !== null) {
        if (dataReturned.data) {
          this.corpID = dataReturned.data.id;
          this.type = dataReturned.data.type;
          this.selectedOption = dataReturned.data.name;
          if (this.type == "corp") {
            this.storage.set("selectedCorp", {name: this.selectedOption, id: this.corpID});
          }
          // retreive sales data by corp/brand/portfolio
          this.getHotelInformation(this.userID, this.token, this.corpID, this.tabVal);
        }
      }
    });
    return await popover.present();
  }

  async openSettings() {
    const modal = await this.modalController.create({
      component: SettingsPage,
    });
    modal.onDidDismiss().then(() => {
      this.ngOnInit();
    });
    return await modal.present();
  }

  //get info by corp/brand
  getHotelInformation (userID, token, corpId, tabVal) {
    this.data = false;
    this.otherData = false;
    this.getFromDate(tabVal);
    if (this.type == "corp") {
      var url1 = "https://mobileapi.nimbleproperty.net/api/Data/IncomeStmt";
      var url2 = "https://mobileapi.nimbleproperty.net/api/Data/BOInfo";
      var url3 = "https://mobileapi.nimbleproperty.net/api/Data/STRInfo";
      var url4 = "https://mobileapi.nimbleproperty.net/api/Data/GSSInfo";
    } else if (this.type == "brand") {
      var url1 = "https://mobileapi.nimbleproperty.net/api/Data/BRIncomeStmt";
      var url2 = "https://mobileapi.nimbleproperty.net/api/Data/BrandBOInfo";
      var url3 = "https://mobileapi.nimbleproperty.net/api/Data/BrandSTRInfo";
      var url4 = "https://mobileapi.nimbleproperty.net/api/Data/BrandGSSInfo";
    }

    console.log(this.fromDate);
    console.log(this.toDate);

    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'UserID': userID,
      'Token': token,
      'Domain': this.domain,
    });
    let options = {
      headers: httpHeaders
    };

    var data = {
      UserID: userID,
      CorpID: corpId,
      BrandID: corpId,
      FromDate: this.fromDate,
      ToDate: this.toDate,
      Type: this.tabVal,
      IncludeUnapproved: this.unapproved,
      Domain: this.domain
    }
    this.http.post(url1, data, options).subscribe((response) => {
      console.log(response);
      var hotelInfo = [];
      for (var key in response) {
        if (response[key].name.indexOf("%") == -1) {
          response[key].currency = "$";
          response[key].percentage = "";
        } else {
          response[key].currency = "";
          response[key].percentage = "%";
        }
        for (var short in this.shortenedNames) {
          if (response[key].name == this.shortenedNames[short].original) {
            response[key].name = this.shortenedNames[short].shortened;
          }
        }
        hotelInfo.push(response[key]);
      }
      this.allHotelInfo = Object.assign([], hotelInfo);
      // only show info that is turned on in settings
      for (var i = 0; i < this.falseSettings.length; i++) {
        for (var j = 0; j < hotelInfo.length; j++) {
          if (this.falseSettings[i].name == hotelInfo[j].name) {
            hotelInfo.splice(j, 1);
          }
        }
      }
      this.salesSections = hotelInfo;
      this.data = true;

      // Update fields in settings
      var settings = [];
      for (var i = 0; i < hotelInfo.length; i++) {
        settings.push({name: hotelInfo[i].name, value: true})
      }
      this.storage.set('salesSections', settings);
    });

    // get Bank Account info
    var data2 = {
      UserID: userID,
      CorpID: corpId,
      BrandID: corpId,
      ToDate: this.toDate,
      Domain: this.domain
    }
    this.http.post(url2, data2, options).subscribe((response) => {
      console.log(response);
      this.otherData = true;
      // set values to other sections
      this.otherSections.filter(obj => {
        return obj.name == "Total Bank Balance";
      })[0].value = response["bb"];
      this.otherSections.filter(obj => {
        return obj.name == "Total Payables";
      })[0].value = response["ap"];
      this.otherSections.filter(obj => {
        return obj.name == "Total Receivables";
      })[0].value = response["ar"];
    });

    // get STR info
    var data3 = {
      UserID: userID,
      CorpID: corpId,
      BrandID: corpId,
      FromDate: this.fromDate,
      ToDate: this.toDate,
      Domain: this.domain
    }
    this.http.post(url3, data3, options).subscribe((response) => {
      // set values to other sections
      console.log(response);
      this.otherSections.filter(obj => {
        return obj.name == "AVG STR INDEX (MPI)";
      })[0].value = response["indexMPI"];
      this.otherSections.filter(obj => {
        return obj.name == "AVG INDEX (ARI)";
      })[0].value = response["indexARI"];
      this.otherSections.filter(obj => {
        return obj.name == "AVG INDEX (RGI)";
      })[0].value = response["indexRGI"];
    });

    // get GSS info
    var data4 = {
      UserID: userID,
      CorpID: corpId,
      BrandID: corpId,
      ToDate: this.toDate,
      Domain: this.domain
    }
    this.http.post(url4, data4, options).subscribe((response) => {
      console.log(response);
      // set values to other sections
      this.otherSections.filter(obj => {
        return obj.name == "AVG GSS";
      })[0].value = response["gss"];
      this.otherSections.filter(obj => {
        return obj.name == "AVG Key Driver";
      })[0].value = response["keyDrivers"];
      this.otherSections.filter(obj => {
        return obj.name == "Total Comments";
      })[0].value = response["comments"];
    });
  }

  // get dates for WTD, MTD, etc.
  getFromDate (type) {
    var today = new Date(this.myDate);
    var day = today.getDay();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    if (type == 1) {
      var from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day + 1);
    } else if (type == 2) {
      var from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (type == 3) {
      var from = new Date(today.getFullYear(), 0, 1);
    } else if (type == 4) {
      var from = today;
    } else if (type == 5) {
      var month = today.getMonth();
      if (month == 1 || month == 2) {
        month = 0;
      } else if (month == 4 || month == 5) {
        month = 3;
      } else if (month == 7 || month == 8) {
        month = 6;
      } else if (month == 10 || month == 11) {
        month = 9;
      }
      var from = new Date(today.getFullYear(), month, 1);
    }
    dd = String(from.getDate()).padStart(2, '0');
    mm = String(from.getMonth() + 1).padStart(2, '0');
    yyyy = from.getFullYear();
    this.fromDate = yyyy + "-" + mm + "-" + dd;
  }

  dateSelected(event) {
    this.toDate = event.substring(0, 10);
    this.getHotelInformation(this.userID, this.token, this.corpID, this.tabVal);
  }

}
