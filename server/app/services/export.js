import { serializeAmbassador, serializeTripler, serializePayout, serializeName } from '../routes/api/v1/va/serializers';
import { ov_config } from '../lib/ov_config';

async function exportAmbassadors(neode) {
  let collection = await neode.model('Ambassador').all();
  let text = '';
  for (let x = 0; x < collection.length; x++) {
    let entry = collection.get(x);
    let ambassador = serializeAmbassador(entry);
    let triplers = entry.get('claims');
    let unconfirmed = 0;
    let pending = 0;
    let confirmed = 0;
    for (let x = 0; x < triplers.length; x++) {
      let tripler = triplers.get(x).otherNode();
      if (tripler.get('status') === 'unconfirmed') {
        unconfirmed++;
      } else if (tripler.get('status') === 'confirmed') {
        confirmed++;
      } else if (tripler.get('status') === 'pending') {
        pending++;
      }
    }
    let payouts = entry.get('gets_paid');
    let total_sent_to_bank = 0;
    let total_earned = 0;
    let disbursed = 0;
    let settled = 0;
    for (let x = 0; x < payouts.length; x++) {
      let payout = payouts.get(x).otherNode();
      if (payout.get('status') === 'disbursed') {
        disbursed++;
      } else if (payout.get('status') === 'settled') {
        settled++;
        total_sent_to_bank += ov_config.payout_per_tripler / 100;
      }
      total_earned += ov_config.payout_per_tripler / 100;
    }

    let ambassador_line = [
      ambassador.external_id,
      new Date(entry.get('created_at')),
      ambassador.first_name,
      ambassador.last_name,
      ambassador.address.address1,
      ambassador.address.zip,
      ambassador.email,
      ambassador.phone,
      unconfirmed,
      pending,
      confirmed,
      total_sent_to_bank,
      total_earned
    ].join(',');

    let header_line = [
      'Google/FB ID',
      'Created at',
      'First Name',
      'Last Name',
      'Street Address',
      'Zip Code',
      'Email',
      'Phone',
      'Unconfirmed',
      'Pending',
      'Confirmed',
      'Total Sent to Bank',
      'Total Earned'
    ];

    if (x === 0) {
      text = text + header_line;
    }

    text = text + '\n' + ambassador_line;
  }

  return text;
}

async function exportTriplers(neode) {
  let collection = await neode.model('Ambassador').all();
  let text = '';
  for (let x = 0; x < collection.length; x++) {
    let entry = collection.get(x);
    let ambassador = serializeAmbassador(entry);
    let relationships = entry.get('claims');
    for (let x = 0; x < relationships.length; x++) {
      let relationship = relationships.get(x);
      let entry = relationship.otherNode();
      let tripler = serializeTripler(entry);
      let tripler_line = [
        tripler.first_name,
        tripler.last_name,
        tripler.address.address1,
        tripler.address.zip,
        tripler.status,
        new Date(relationship.get('since')),
        new Date(entry.get('confirmed_at')),
        serializeName(ambassador.first_name, ambassador.last_name),
        tripler.phone,
        tripler.triplees ? tripler.triplees[0] : '',
        tripler.triplees ? tripler.triplees[1] : '',
        tripler.triplees ? tripler.triplees[2] : '',
      ];

      let header_line = [
        'First Name',
        'Last Name',
        'Street',
        'Zip',
        'Status',
        'Date Claimed',
        'Date Confirmed',
        'Ambassador Name',
        'Phone',
        'Triplee1',
        'Triplee2',
        'Triplee3'
      ];

      if (x === 0) {
        text = text + header_line;
      }

      text = text + '\n' + tripler_line;
    }
  }

  return text;
}

module.exports = {
  exportAmbassadors: exportAmbassadors,
  exportTriplers: exportTriplers
}
