const got = require("got");
const tough = require("tough-cookie");
const util = require("util");
const CryptoJS = require("./cryptojs");

class JwxtLogin {
  constructor(username, password) {
    var that = this;
    this.username = username;
    this.password = JwxtLogin.encryptByDES(password);
    this.cookiejar = new tough.CookieJar();
    this.setCookie = util.promisify(
      that.cookiejar.setCookie.bind(that.cookiejar)
    );
  }
  /*
   * 前往主页
   */
  async getIndex() {
    var that = this;
    var cookieJar = that.cookiejar;
    try {
      await got(
        "https://auth.sztu.edu.cn/idp/oauth2/authorize?redirect_uri=https%3A%2F%2Fjwxt.sztu.edu.cn%2FLogon.do%3Fmethod%3DlogonSSOszjsdx&state=1111&client_id=jiaowu&response_type=code",
        {
          https: {
            rejectUnauthorized: false,
          },
          hooks: {
            beforeRedirect: [
              (options) => {
                if (
                  options.url.href ===
                  "https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain?entityId=jiaowu"
                ) {
                  throw "200";
                }
              },
            ],
          },
          cookieJar,
          timeout: {
            request: 3000,
          },
        }
      );
    } catch (error) {
      console.log("getIndex finish");
    }
  }
  /*
   *登录操作
   */
  async login(username, password) {
    //formData获取
    let formData = {
      j_username: username,
      j_password: password,
      j_checkcode: "验证码",
      op: "login",
      spAuthChainCode: "cc2fdbc3599b48a69d5c82a665256b6b",
    };
    let cookieJar = this.cookiejar;
    this.setCookie("x=x", "https://auth.sztu.edu.cn");
    let cookies = [];
    const ActionAuthChain = async () =>
      got.post("https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain", {
        https: {
          rejectUnauthorized: false,
        },
        headers: {
          "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        form: formData,
        cookieJar,
        encoding: "utf-8",
        timeout: {
          request: 5000,
        },
      });
    const currentAuth = async () =>
      got.post(
        "https://auth.sztu.edu.cn/idp/AuthnEngine?currentAuth=urn_oasis_names_tc_SAML_2.0_ac_classes_BAMUsernamePassword",
        {
          https: {
            rejectUnauthorized: false,
          },
          headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: cookies.join("; "),
          },
          form: formData,
          encoding: "utf-8",
          followRedirect: false,
          timeout: {
            request: 5000,
          },
        }
      );
    const SSO = async () => {
      try {
        await got.get(
          "https://auth.sztu.edu.cn:443/idp/profile/OAUTH2/AuthorizationCode/SSO",
          {
            https: {
              rejectUnauthorized: false,
            },
            hooks: {
              beforeRedirect: [
                (options) => {
                  const { href } = options.url;
                  if (
                    href ===
                    "http://jwxt.sztu.edu.cn/jsxsd/framework/xsMain.htmlx"
                  ) {
                    throw "200";
                  }
                },
              ],
            },
            encoding: "utf-8",
            timeout: {
              request: 5000,
            },
            cookieJar,
          }
        );
      } catch (error) {
        console.log("finish SSO");
      }
    };
    try {
      await ActionAuthChain();
      this.cookiejar.toJSON().cookies.forEach((element) => {
        if (element.domain == "auth.sztu.edu.cn") {
          cookies.push(element.key + "=" + element.value);
        }
      });
      await currentAuth();
      await SSO();
      cookies = [];
      this.cookiejar.toJSON().cookies.forEach((element) => {
        if (element.domain == "jwxt.sztu.edu.cn") {
          cookies.push(element.key + "=" + element.value);
        }
      });
      return {
        cookies: cookies,
        lastAccessed: this.cookiejar.toJSON().cookies[0].lastAccessed,
      };
    } catch (error) {
      console.log(error);
    }
  }
  async start() {
    try {
      const startTime = Date.now();
      await this.getIndex();
      const finishIndexTime = Date.now();
      console.log("getIndex use【" + (finishIndexTime - startTime) + "】ms");
      const res = await this.login(this.username, this.password);
      const finishLoginTime = Date.now();
      console.log("login use【" + (finishLoginTime - finishIndexTime) + "】ms");
      return res;
    } catch (error) {
      console.log(error);
    }
  }
  //DES加密
  static encryptByDES(message, key) {
    var key = "PassB01Il71";
    var keyHex = CryptoJS.enc.Utf8.parse(key);
    var encrypted = CryptoJS.DES.encrypt(message, keyHex, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  }
}

module.exports = JwxtLogin;
