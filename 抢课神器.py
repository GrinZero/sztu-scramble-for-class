import base64,json,os,sys,time,traceback,requests
from configparser import ConfigParser
import urllib3
from Crypto.Cipher import DES
urllib3.disable_warnings()

conf = ConfigParser()
conf.read("config.txt",encoding='utf-8')
user = conf.get('mysql', 'username')
pwd = conf.get('mysql', 'password')
jx=conf.get('mysql', 'jx0404id')
kc=conf.get('mysql', 'kcid')
cno=conf.get('mysql', 'cno')
cd=conf.get('mysql','cd')


def pad(data, block_size=8):
    length = block_size - (len(data) % block_size)
    return data.encode(encoding='utf-8') + (chr(length) * length).encode(encoding='utf-8')
class Auth:
    cookies = {}
    ok = False

    def __init__(self, cookies=None):
        self.session = requests.session()
        self.session.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' \
                                             'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36'
        self.session.headers['Host'] = 'auth.sztu.edu.cn'
        self.session.headers['Referer'] = 'https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain?entityId=jiaowu'
        self.session.headers['Origin'] = 'https://auth.sztu.edu.cn'
        self.session.headers['X-Requested-With'] = 'XMLHttpRequest'
        self.session.headers['Sec-Fetch-Site'] = 'same-origin'
        self.session.headers['Sec-Fetch-Mode'] = 'cors'
        self.session.headers['Sec-Fetch-Dest'] = 'empty'
        self.session.headers['sec-ch-ua-mobile'] = '?0'
        self.session.headers['sec-ch-ua-platform'] = '"macOS"'
        self.session.headers['sec-ch-ua'] = '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"'
        self.session.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
        if cookies:
            self.session.cookies = requests.utils.cookiejar_from_dict(cookies)
            self.check_login()

    def login(self, school_id, password):
        # 初始化 session
        self.session.headers['Host'] = 'jwxt.sztu.edu.cn'
        resp = self.get('https://jwxt.sztu.edu.cn/')
        # 1
        resp = self.get(resp.headers['Location'])
        # 2
        resp = self.get(resp.headers['Location'])

        self.session.headers['Host'] = 'auth.sztu.edu.cn'
        self.get(resp.headers['Location'])

        self.get('https://auth.sztu.edu.cn/idp/AuthnEngine')
        self.get('https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain?entityId=jiaowu')
        # 构造登录
        data = {
            'j_username': school_id,
            'j_password': self.encryptByDES(password),
            'j_checkcode': '验证码',
            'op': 'login',
            'spAuthChainCode': 'cc2fdbc3599b48a69d5c82a665256b6b'
        }
        #print(data['j_password'])
        resp = self.post('https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain', data)
        resp = resp.json()
        # print(resp)
        if resp['loginFailed'] != 'false':
            return {}, False

        resp = self.post('https://auth.sztu.edu.cn/idp/AuthnEngine?'
                         'currentAuth=urn_oasis_names_tc_SAML_2.0_ac_classes_BAMUsernamePassword',
                         data=data)
        ssoURL = resp.headers['Location']
        resp = self.get(ssoURL)
        logonUrl = resp.headers['Location']

        self.session.headers['Host'] = 'jwxt.sztu.edu.cn'
        resp = self.get(logonUrl)
        oldCookie = self.session.cookies.get_dict()
        oldCookie = oldCookie['JSESSIONID']
        loginToTkUrl = resp.headers['Location']
        self.get(loginToTkUrl)
        # print(oldCookie)
        self.get('https://jwxt.sztu.edu.cn/jsxsd/framework/xsMain.htmlx')
        self.cookies = self.session.cookies.get_dict()
        self.check_login()
        mycookie = 'JSESSIONID=' + oldCookie + ';JSESSIONID=' + self.cookies['JSESSIONID'] + ';SERVERID=' + \
                   self.cookies['SERVERID']
        return mycookie

    @staticmethod
    def encryptByDES(message, key='PassB01Il71'):
        key1 = key.encode('utf-8')[:8]
        cipher = DES.new(key=key1, mode=DES.MODE_ECB)
        encrypted_text = cipher.encrypt(pad(message, block_size=8))
        encrypted_text = base64.b64encode(encrypted_text).decode('utf-8')
        return encrypted_text
    # @staticmethod
    # def encryptByDES(message):
    #     secret_key = 'PassB01Il71'[0:8]  # 密钥
    #     iv = secret_key  # 偏移
    #     # secret_key:加密密钥，EBC:加密模式，iv:偏移, padmode:填充
    #     des_obj = des(secret_key, ECB, iv, pad=None, padmode=PAD_PKCS5)
    #     # 返回为字节
    #     secret_bytes = des_obj.encrypt(message, padmode=PAD_PKCS5)
    #     # 返回为base64
    #     return base64.b64encode(secret_bytes)

    def check_login(self):
        resp = self.get('https://jwxt.sztu.edu.cn/jsxsd/framework/xsMain.htmlx')
        self.ok = (resp.status_code == 200)

    def get(self, url):
        return self.session.get(url, timeout=2, cookies=self.cookies, verify=False, allow_redirects=False)

    def get_excel(self, url):
        headers = self.session.headers
        headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,' \
                            'image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        return self.session.get(url, headers=headers, timeout=2, cookies=self.cookies, verify=False)

    def post(self, url, data):
        return self.session.post(url, timeout=2, cookies=self.cookies, verify=False, data=data, allow_redirects=False)
    def logintoXK(self,cno):
        #'https://jwxt.sztu.edu.cn/jsxsd/xsxk/xsxk_index?jx0502zbid=278726FB79EC4ECD84A57F51CBE2E4E9'
        url='https://jwxt.sztu.edu.cn/jsxsd/xsxk/xsxk_index?jx0502zbid=79578E8CB69745F6BC7A5F2DDE2991E9'
        res=self.get(url)
        #print(res.text)
        if cno=="0":
            url = "https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/xsxkBxqjhxk?kcxx=&skls=&skxq=&skjc=&sfym=false&sfct=true&sfxx=true&skfs="
            data="sEcho=1&iColumns=13&sColumns=&iDisplayStart=0&iDisplayLength=15&mDataProp_0=kch&mDataProp_1=kczh&mDataProp_2=kcmc&mDataProp_3=xf&mDataProp_4=skls&mDataProp_5=sksj&mDataProp_6=skdd&mDataProp_7=xqmc&mDataProp_8=syzxwrs&mDataProp_9=syfzxwrs&mDataProp_10=ctsm&mDataProp_11=szkcflmc&mDataProp_12=czOper"

        else:
            url="https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/xsxkGgxxkxk?kcxx=&skls=&skxq=&skjc=&sfym=false&sfct=true&szjylb=&sfxx=true&skfs="
            data="sEcho=1&iColumns=14&sColumns=&iDisplayStart=0&iDisplayLength=15&mDataProp_0=kch&mDataProp_1=kczh&mDataProp_2=kcmc&mDataProp_3=zyfxmc&mDataProp_4=fzmc&mDataProp_5=xf&mDataProp_6=skls&mDataProp_7=sksj&mDataProp_8=skdd&mDataProp_9=xqmc&mDataProp_10=syzxwrs&mDataProp_11=syfzxwrs&mDataProp_12=ctsm&mDataProp_13=czOper"
        self.post(url,data=data)
        return res.text
    def get_course(self,kcid,jxid,cno):
        if cno=="0":#0是主选 其他是公选
            # url = "https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/fawxkOper?kcid=" + kcid + "&cfbs=null&jx0404id=" + jxid + "&xkzy=&trjf="
            url="https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/bxqjhxkOper?kcid=" + kcid + "&cfbs=null&jx0404id=" + jxid + "&xkzy=&trjf="
        else:
            url="https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/ggxxkxkOper?kcid=" + kcid + "&cfbs=null&jx0404id=" + jxid + "&xkzy=&trjf="
        res = self.get(url)
        #print(res.text)
        return res.text
if __name__ == "__main__":

        try:
            a=Auth()
            q = a.login(user, pwd)
            #print(q)
            a.logintoXK(cno)
            cnt=0
            sn=""
            while True:
                sn=a.get_course(kc,jx,cno)
                sn=json.loads(sn)
                #print(sn)
                try:
                    if("选课成功" not in sn["message"]):
                        cnt += 1
                        sys.stdout.write("\r已监控{}次，状态:{}".format(cnt, sn["message"]))
                        sys.stdout.flush()
                        time.sleep(int(cd))
                    else:
                        print(sn["message"])
                        os.system("pause")
                except:
                    pass
        except Exception as e:
            print(e)  # 输出：division by zero
            print(sys.exc_info())
            print('\n', '>>>' * 20)
            print(traceback.print_exc())
            print('\n', '>>>' * 20)
            print(traceback.format_exc())
            os.system("pause")