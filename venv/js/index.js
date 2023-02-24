//---------------------------------------配置
const { username, password, jx0404idList } = require("./config");

let jx0404idLists = jx0404idList;

//---------------------------------------配置

const got = require("got");
const JwxtLogin = require("./login");
const cheerio = require("cheerio");

const sleep = (timeout) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

const beforeStart = async () => {
  const login = async () => {
    let cookies = [];
    let count = 0;
    while (cookies.length !== 3) {
      try {
        let { cookies: nowCookies } = await new JwxtLogin(
          username,
          password
        ).start();
        cookies = nowCookies;
      } catch {
        console.error("Login Error", ++count);
      }
    }
    return cookies;
  };
  const getPublicLink = async (cookies) => {
    const getPublicHTML = async () => {
      try {
        return await got("https://jwxt.sztu.edu.cn/jsxsd/xsxk/xklc_list", {
          https: {
            rejectUnauthorized: false,
          },
          headers: {
            Cookie: cookies.join(";"),
          },
          timeout: {
            request: 5000,
          },
        });
      } catch (error) {
        console.error("getPublicList error", error);
      }
    };
    let html = await getPublicHTML();
    while (!html) {
      html = await getPublicHTML();
    }
    const $ = cheerio.load(html.body);
    const linkHTML = $("#attend_class tr > td:nth-child(4)").html();
    try {
      return linkHTML.split('toxk(\'')[1].split('\')')[0];
    } catch (e) {
      return null;
    }
  };
  const getChooseLink = async (cookies, link) => {
    console.info("getChooseLink start");
    const fetchPublic = async () => {
      try {
        return await got(`https://jwxt.sztu.edu.cn/jsxsd/xsxk/xklc_view?jx0502zbid=${link}`, {
          https: {
            rejectUnauthorized: false,
          },
          headers: {
            Cookie: cookies.join(";"),
          },
          timeout: {
            request: 5000,
          },
        });
      } catch (error) {
        console.error("fetchPublicLink error", error);
      }
    };
    let html = await fetchPublic();
    while (!html) {
      html = await fetchPublic();
    }
    try {
      const id = html.body.split("xsxkOpen('")[1].split("'")[0];
      return `/jsxsd/xsxk/xsxk_index?jx0502zbid=${id}`;
    } catch {
      return null;
    }
  };
  const fetchChooseLink = async (cookies, link) => {
    console.info("fetchChooseLink",link);
    const fetchLink = async () => {
      try {
        return await got(`https://jwxt.sztu.edu.cn${link}`, {
          https: {
            rejectUnauthorized: false,
          },
          headers: {
            Cookie: cookies.join(";"),
          },
          timeout: {
            request: 5000,
          },
        });
      } catch (error) {
        console.error("fetchLink error", error);
      }
    };
    const html = await fetchLink();
  };

  const cookies = await login();
  let link = await getPublicLink(cookies);
  while (!link) {
    link = await getPublicLink(cookies);
  }
  console.info("PublicLink", link);
  let chooseLink = await getChooseLink(cookies, link);
  while (!link) {
    link = await getChooseLink(cookies);
  }
  console.info("chooseLink", chooseLink);
  await fetchChooseLink(cookies, chooseLink);
  return cookies;
};

const start = async (cookies) => {
  const getCourseList = async () => {
    try {
      return await got
        .post(
          "https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/xsxkGgxxkxk?kcxx=&skls=&skxq=&skjc=&sfym=false&sfct=true&szjylb=4&sfxx=true&skfs=",
          {
            https: {
              rejectUnauthorized: false,
            },
            headers: {
              Cookie: cookies.join(";"),
              "content-type":
                "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: "sEcho=1&iColumns=13&sColumns=&iDisplayStart=0&iDisplayLength=15&mDataProp_0=kch&mDataProp_1=kczh&mDataProp_2=kcmc&mDataProp_3=xf&mDataProp_4=skls&mDataProp_5=sksj&mDataProp_6=skdd&mDataProp_7=xqmc&mDataProp_8=syzxwrs&mDataProp_9=syfzxwrs&mDataProp_10=ctsm&mDataProp_11=szkcflmc&mDataProp_12=czOper",
            timeout: {
              request: 5000,
            },
          }
        )
        .json();
    } catch (error) {
      console.error("getCourseList timeout");
    }
  };
  const chooseCourse = async ({ jx02id, jx0404id }) => {
    try {
      return await got(
        `https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/ggxxkxkOper?kcid=${jx02id}&cfbs=null&jx0404id=${jx0404id}&xkzy=&trjf=`,
        {
          https: {
            rejectUnauthorized: false,
          },
          headers: {
            Cookie: cookies.join(";"),
            Host: "jwxt.sztu.edu.cn",
            Referer: " https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/comeInGgxxkxk",
          },
          timeout: {
            request: 5000,
          },
        }
      ).json();
    } catch {
      throw "chooseCourse timeout";
    }
  };
  const list = await getCourseList();
  const taskList = list.aaData.filter(
    (item) => jx0404idLists.includes(item.jx0404id) && item.syfzxwrs > 0
  );
  const promiseList = [];
  taskList.forEach((item) => {
    promiseList.push(
      new Promise(async (resolve) => {
        try {
          resolve({
            jx0404id: item.jx0404id,
            result: await chooseCourse(item),
          });
        } catch (error) {
          reject(error);
        }
      })
    );
  });
  const result = await Promise.allSettled(promiseList);
  const successList = result
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value);

  successList.forEach((item) => {
    if (!item.result.success) return;
    jx0404idLists = jx0404idLists.filter((sitem) => sitem !== item.jx0404id);
  });
  console.log("successList", successList);
  console.log("jx0404idLists", jx0404idLists);
};

const main = async () => {
  const cookies = await beforeStart();
  let count = 0;
  while (true) {
    if (jx0404idLists.length === 0) {
      break;
    }
    if (count >= 10) {
      break;
    }
    try {
      count = 0;
      await start(cookies);
    } catch (error) {
      count++;
      console.log("chooseCourse timeout", count);
    }
    const timeout = ~~(Math.random() * 3000);
    console.log("#delay:", timeout < 1000 ? 1000 : timeout, "ms");
    await sleep(timeout < 1000 ? 1000 : timeout);
  }
};

(async () => {
  while (true) {
    await main();
  }
})();

// 0755-23256064 教务
// 0755-23256162 外国语教学秘书 - 尹
// 0755-23256354 新材料教学秘书 - 孟
