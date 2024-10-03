import moxieResolve from "../../../../public/moxie_resolve.json";
import updatedNames from "../../../../public/updated_names.json";

const data = moxieResolve as DataItem[];

interface DataItem {
  fid: number;
  address: string;
  profileName: string;
  type: "WALLET_ADDRESS" | "VESTING_ADDRESS";
}

function getUpdatedName(fid: number) {
  return updatedNames.find((r) => r?.fid === fid);
}

export function getUsername(fid: number) {
  const updatedName = getUpdatedName(fid);
  if (updatedName) {
    return updatedName.profileName;
  }
  const dataItem = data.find((r) => r?.fid === fid);
  return dataItem?.profileName;
}

export function getUserData(address: string) {
  const dataItem = data.find((r) => r?.address === address);
  if (!dataItem) {
    return null;
  }
  return {
    fid: dataItem.fid,
    username: getUpdatedName(dataItem.fid)?.profileName || dataItem.profileName,
  };
}

export function getAllAddresses(fid: number) {
  return data.filter((r) => r?.fid === fid).map((r) => r?.address);
}

export function getFid(handle: string) {
  const updatedName = updatedNames.find((r) => r?.profileName === handle);
  if (updatedName) {
    return updatedName.fid;
  }
  const dataItem = data.find((r) => r?.profileName === handle);
  return dataItem?.fid;
}