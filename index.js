//---------------------------------------配置
const { username, password, jx0404List } = require("./config");

let jx0404Lists = jx0404List;

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
      return linkHTML.split("toxk('")[1].split("')")[0];
    } catch (e) {
      return null;
    }
  };
  const getChooseLink = async (cookies, link) => {
    console.info("getChooseLink start");
    const fetchPublic = async () => {
      try {
        return await got(
          `https://jwxt.sztu.edu.cn/jsxsd/xsxk/xklc_view?jx0502zbid=${link}`,
          {
            https: {
              rejectUnauthorized: false,
            },
            headers: {
              Cookie: cookies.join(";"),
            },
            timeout: {
              request: 5000,
            },
          }
        );
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
    console.info("fetchChooseLink", link);
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
  const getCourseList = async (type = "公选课选课", page = 1, name = null) => {
    const _name = name ? encodeURIComponent(name) : "";

    const url =
      type === "公选课选课"
        ? `/xsxkGgxxkxk?kcxx=${_name}&skls=&skxq=&skjc=&sfym=false&sfct=true&szjylb=4&sfxx=true&skfs=`
        : `/xsxkBxqjhxk?kcxx=${_name}&skls=&skxq=&skjc=&sfym=false&sfct=true&sfxx=true&skfs=`;

    const body =
      type === "公选课选课"
        ? `sEcho=${page}&iColumns=13&sColumns=&iDisplayStart=0&iDisplayLength=15&mDataProp_0=kch&mDataProp_1=kczh&mDataProp_2=kcmc&mDataProp_3=xf&mDataProp_4=skls&mDataProp_5=sksj&mDataProp_6=skdd&mDataProp_7=xqmc&mDataProp_8=syzxwrs&mDataProp_9=syfzxwrs&mDataProp_10=ctsm&mDataProp_11=szkcflmc&mDataProp_12=czOper`
        : `sEcho=${page}&iColumns=14&sColumns=&iDisplayStart=0&iDisplayLength=15&mDataProp_0=kch&mDataProp_1=kczh&mDataProp_2=kcmc&mDataProp_3=zyfxmc&mDataProp_4=fzmc&mDataProp_5=xf&mDataProp_6=skls&mDataProp_7=sksj&mDataProp_8=skdd&mDataProp_9=xqmc&mDataProp_10=syzxwrs&mDataProp_11=syfzxwrs&mDataProp_12=ctsm&mDataProp_13=czOper`;
    try {
      return await got
        .post(`https://jwxt.sztu.edu.cn/jsxsd/xsxkkc${url}`, {
          https: {
            rejectUnauthorized: false,
          },
          headers: {
            Cookie: cookies.join(";"),
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: body,
          timeout: {
            request: 5000,
          },
        })
        .json();
    } catch (error) {
      console.error("getCourseList timeout");
    }
  };
  const chooseCourse = async ({ jx02id, jx0404id, type = "公选课选课" }) => {
    try {
      return await got(
        `https://jwxt.sztu.edu.cn/jsxsd/xsxkkc/${
          type === "公选课选课" ? "ggxxkxkOper" : "bxqjhxkOper"
        }?kcid=${jx02id}&cfbs=null&jx0404id=${jx0404id}&xkzy=&trjf=`,
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

  console.log("\n");
  // 第一步，获取各个课程的list
  const courseLists = jx0404Lists.map((item) =>
    getCourseList(item.type, 1, item.name)
  );
  const resultLists = await Promise.all(courseLists);
  resultLists.forEach((item, index) => {
    if (item.aaData.length === 0) {
      console.error(`#${jx0404Lists[index].name} 未找到`);
    }
  });

  // 第二步，筛选出符合条件的课程
  const jx0404idLists = jx0404Lists.map((item) => item.id);
  const taskList = resultLists
    .map((item) => {
      return item.aaData.filter(
        (item) =>
          (item.syfzxwrs > 0 || item.syzxwrs > 0) &&
          jx0404idLists.includes(item.jx0404id)
      );
    })
    .flat(1);
  taskList.forEach((item) => {
    const type = jx0404Lists.find((sitem) => sitem.id === item.jx0404id).type;
    item.type = type;
  });

  // 第三步，选课
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
    jx0404Lists = jx0404Lists.filter((sitem) => sitem.id !== item.jx0404id);
  });
  console.log("successList", successList);
  console.log("jx0404Lists", jx0404Lists);
};

const main = async () => {
  const cookies = await beforeStart();
  let count = 0;
  while (true) {
    if (jx0404Lists.length === 0) {
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
      console.log("chooseCourse timeout", count, error);
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
