export type Team = {
  id: string;
  name: string;
  nameEn: string;
  /** Unicode 国旗絵文字 (フォールバック表示用) */
  flag: string;
  /** ISO 3166-1 alpha-2 コード (例: "jp")。flagcdn.com で SVG 取得に使用。
   *  英国構成国は "gb-eng" / "gb-sct" のサブディビジョン形式 */
  isoCode: string;
  groupId: string;
};

export type Group = {
  id: string;
  teamIds: string[];
};
