import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {


  salesSections;
  unapproved;

  constructor(private storage: Storage, private modalController: ModalController) { }

  ngOnInit() {
    this.storage.get("salesSettings").then(res => {
      if (!res) {
        this.storage.get("salesSections").then(res2 => {
          this.salesSections = res2;
          console.log(res2);
        });
        this.unapproved = true;
      } else {
        this.salesSections = res;
        this.storage.get("salesSections").then(res2 => {
          for (var i = 0; i < res2.length; i++) {
            var exists = false;
            for (var j = 0; j < this.salesSections.length; j++) {
              if (this.salesSections[j].name == res2[i].name) {
                exists = true;
              }
            }
            if (!exists) {
              this.salesSections.push(res2[i]);
            }
          }
        });
        this.unapproved = this.storage.get("unapproved").then(res2 => {
          this.unapproved = res2;
        });
      }
    })
  }

  close() {
    this.storage.set('salesSettings', this.salesSections);
    this.storage.set('unapproved', this.unapproved); 
    this.modalController.dismiss();
  }

}
