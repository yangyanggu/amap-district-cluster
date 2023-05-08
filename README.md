# @vuemap/district-cluster
[![npm (tag)](https://img.shields.io/npm/v/@vuemap/district-cluster)](https://www.npmjs.org/package/@vuemap/district-cluster)
[![NPM downloads](http://img.shields.io/npm/dm/@vuemap/district-cluster.svg)](https://npmjs.org/package/@vuemap/district-cluster)
![JS gzip size](http://img.badgesize.io/https://unpkg.com/@vuemap/district-cluster/dist/index.js?compression=gzip&label=gzip%20size:%20JS)
[![NPM](https://img.shields.io/npm/l/@vuemap/district-cluster)](https://github.com/yangyanggu/amap-district-cluster)
[![star](https://badgen.net/github/stars/yangyanggu/amap-district-cluster)](https://github.com/yangyanggu/amap-district-cluster)

### 示例
[codepen示例](https://codepen.io/yangyanggu/pen/YzjBvQM)

### 简介
本项目为高德地图的区划聚合图层，图层基于AMapUI的区划插件实现，[原插件地址](https://lbs.amap.com/api/amap-ui/reference-amap-ui/geo/district-cluster)

### 加载方式
当前项目支持CDN加载和npm加载两种方式。

#### CDN加载
CDN加载需要先加载高德地图JS，代码如下
```js
<!--加载高德地图JS 2.0 -->
<script src = 'https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY'></script>
<!--加载district-cluster插件 -->
<script src="https://cdn.jsdelivr.net/npm/@vuemap/district-cluster/dist/index.js"></script>
```

#### npm加载
npm加载可以直接使用安装库
```shell
npm install '@vuemap/district-cluster'
```

### 使用示例

#### CDN方式
```js
<script src = 'https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY'></script>
<script src="https://cdn.jsdelivr.net/npm/@vuemap/district-cluster/dist/index.js"></script>
<script type="text/javascript">
    const map = new AMap.Map('app', {
      center: [120,31],
      zoom: 14,
      viewMode: '3D',
      pitch: 35
    })
    const layer = new AMap.DistrictCluster({
      map,
      // topAdcodes: [130000, 110000],
      getPosition: function(item) {
        if (!item) {
          return null;
        }
        const parts = item.split(',');
        //返回经纬度
        return [parseFloat(parts[0]), parseFloat(parts[1])];
      },
      renderOptions: {
        zooms: [2,16],
        renderClusterMarker(feature, dataItems){
          return new AMap.Marker({
            position: feature.properties.center,
            anchor: 'center',
            content: `<div style="word-break: keep-all;color: #fff;">${feature.properties.name} - ${dataItems.length}</div>`
          })
        },
        renderPolygon(feature, dataItems){
          return new AMap.Polygon({
            path: feature.geometry.coordinates,
            strokeColor: 'red',
          })
        }
      }
    })
    layer.on('featureClick', (e, feature) => {
      console.log('featureClick: ', e, feature)
    })
    layer.on('featureMouseover', (e, feature) => {
      console.log('featureMouseover: ', e, feature)
    })
    layer.on('featureMouseout', (e, feature) => {
      console.log('featureMouseout: ', e, feature)
    })
    layer.on('clusterMarkerClick', (e, feature) => {
      console.log('clusterMarkerClick: ', e, feature)
    })
    fetch('https://a.amap.com/amap-ui/static/data/10w.txt').then(res => {
      return res.text()
    }).then(csv => {
      const data = csv.split('\n');
      layer.setData(data);
    })
  
</script>
```

#### npm方式
```ts
const map = new AMap.Map('app', {
  center: [120,31],
  zoom: 14,
  viewMode: '3D',
  pitch: 35
})
const layer = new AMap.DistrictCluster({
  map,
  // topAdcodes: [130000, 110000],
  getPosition: function(item) {
    if (!item) {
      return null;
    }
    const parts = item.split(',');
    //返回经纬度
    return [parseFloat(parts[0]), parseFloat(parts[1])];
  },
  renderOptions: {
    zooms: [2,16],
    renderClusterMarker(feature, dataItems){
      return new AMap.Marker({
        position: feature.properties.center,
        anchor: 'center',
        content: `<div style="word-break: keep-all;color: #fff;">${feature.properties.name} - ${dataItems.length}</div>`
      })
    },
    renderPolygon(feature, dataItems){
      return new AMap.Polygon({
        path: feature.geometry.coordinates,
        strokeColor: 'red',
      })
    }
  }
})
layer.on('featureClick', (e, feature) => {
  console.log('featureClick: ', e, feature)
})
layer.on('featureMouseover', (e, feature) => {
  console.log('featureMouseover: ', e, feature)
})
layer.on('featureMouseout', (e, feature) => {
  console.log('featureMouseout: ', e, feature)
})
layer.on('clusterMarkerClick', (e, feature) => {
  console.log('clusterMarkerClick: ', e, feature)
})
fetch('https://a.amap.com/amap-ui/static/data/10w.txt').then(res => {
  return res.text()
}).then(csv => {
  const data = csv.split('\n');
  layer.setData(data);
})
```

### API文档说明

#### DistrictCluster图层说明
基于AMapUI的[DistrictCluster](https://lbs.amap.com/api/amap-ui/reference-amap-ui/geo/district-cluster)进行改造适配JS2.0的区划聚合插件，支持2D 3D展示，区划面与聚合点支持自定义<br/>
``  new AMap.DistrictCluster(options: DistrictClusterOptions)  ``<br/>
###### 参数说明
options: DistrictCluster初始化参数，参数内容如下：

| 属性名             | 属性类型                                                  | 属性描述                                                                                                                                                                                                                                                   |
|-----------------|-------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| map             | AMap.Map                                              | 地图实例                                                                                                                                                                                                                                                   |
| zIndex          | Number                                                | 图层的层级，默认为 10                                                                                                                                                                                                                                           |
| visible         | Boolean                                               | 图层是否可见，默认为 true                                                                                                                                                                                                                                        |
| data            | any[]                                                 | 数据源数组，每个元素即为点相关的信息                                                                                                                                                                                                                                     |
| getPosition     | (dataItem: any, dataIndex: number) => AMap.LngLatLike | 返回数据项中的经纬度信息                                                                                                                                                                                                                                           |
| autoSetFitView  | Boolean                                               | 是否在绘制后自动调整地图视野以适合全部点，默认true                                                                                                                                                                                                                            |
| topAdcodes      | number[]                                              | 顶层区划的adcode列表。（[TXT](https://webapi.amap.com/ui/1.0/ui/geo/DistrictExplorer/assets/d_v1/area_tree.txt)，[JSON](https://webapi.amap.com/ui/1.0/ui/geo/DistrictExplorer/assets/d_v1/area_tree.json)）默认为[100000]，即全国范围.假如仅需要展示河北和北京，可以设置为[130000, 110000], |
| excludedAdcodes | number[]                                              | 需要排除的区划的adcode列表                                                                                                                                                                                                                                       |
| renderOptions   | RenderOptions                                         | 绘制的引擎的参数，参数列表见[下面](#RenderOptions参数说明)                                                                                                                                                                                                                 |

###### RenderOptions参数说明
| 属性名                                  | 属性类型                                             | 属性描述                                                                                                                                                     |
|--------------------------------------|--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| minHeightToShowSubFeatures           | Number                                           | 父级区划的最小显示高度，默认630                                                                                                                                        |
| minSiblingAvgHeightToShowSubFeatures | Number                                           | 父级区划的同级兄弟区划的最小平均显示高度，默认600                                                                                                                               |
| minSubAvgHeightToShowSubFeatures     | Number                                           | 子级区划的最小平均显示高度，默认300, 当上面3个条件同时满足时，切换到子级显示                                                                                                                |
| featureStyleByLevel                  | FeatureStyleByLevelOption                        | 按区划级别（如下4类）定义的区划面样式  ```{country: FeatureStyle, province: FeatureStyle, city: FeatureStyle, district: FeatureStyle}  ```, [默认值](#featureStyleByLevel默认值) |
| minHeightToShowSubFeatures           | Number                                           | 父级区划的最小显示高度，默认630                                                                                                                                        |
| areaNodeCacheLimit                   | Number                                           | AreaNode缓存的数量，默认-1，即不限制                                                                                                                                  |
| getFeatureStyle                      | (feature: any, dataItems: any[]) => StyleOption  | 直接指定某个区划的样式，优先级最高                                                                                                                                        |
| zooms                                | [Number, Number]                                 | 绘制的层级范围，默认 [2, 30]                                                                                                                                       | 
| renderPolygon                        | (feature: any, dataItems: any[]) => AMap.Polygon | 自定义绘制多边形                                                                                                                                                 |
| renderClusterMarker                  | (feature: any, dataItems: any[]) => AMap.Marker  | 自定义绘制聚合标号                                                                                                                                                |
| clusterMarkerEventSupport            | Boolean                                          | 聚合标注是否开启事件支持，默认true。                                                                                                                                     |
| clusterMarkerClickToShowSub          | Boolean                                          | 点击聚合标注是否触发展示子级区划（即调用 zoomToShowSubFeatures 方法），默认true                                                                                                    |
| featureEventSupport                  | Boolean                                          | 区划面是否开启事件支持，默认true                                                                                                                                       |
| featureClickToShowSub                | Boolean                                          | 点击区划面是否触发进入子级区划，默认false                                                                                                                                  |


###### FeatureStyle参数说明
| 属性名 | 属性类型   | 属性描述                              |
| ---- |--------|-----------------------------------|
| strokeColor | String | 线条颜色，使用16进制颜色代码赋值。                |
| strokeOpacity | Number | 轮廓线透明度，取值范围 [0,1] ，0表示完全透明，1表示不透明 |
| strokeWeight | Number | 轮廓线宽度                             |
| fillColor | String | 多边形填充颜色，使用16进制颜色代码赋值 | 
| fillOpacity | Number | 多边形填充透明度，取值范围 [0,1] ，0表示完全透明，1表示不透明 |

<a name="featureStyleByLevel默认值" ></a>
###### featureStyleByLevel默认值
```js
{
  country: {
    strokeColor: 'rgb(31, 119, 180)',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: 'rgb(49, 163, 84)',
    fillOpacity: 0.8
  },
  province: {
    strokeColor: 'rgb(31, 119, 180)',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: 'rgb(116, 196, 118)',
    fillOpacity: 0.7
  },
  city: {
    strokeColor: 'rgb(31, 119, 180)',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: 'rgb(161, 217, 155)',
    fillOpacity: 0.6
  },
  district: {
    strokeColor: 'rgb(31, 119, 180)',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: 'rgb(199, 233, 192)',
    fillOpacity: 0.5
  }
}
```


###### 成员函数

| 函数名                   | 入参                                 | 返回值     | 描述                                                                 |
|-----------------------|------------------------------------|---------|--------------------------------------------------------------------|
| setData               | Array                              | 无       | 设定数据源数组，并触发重新绘制                                                    |
| renderLater           | number                             | 无       | 延时设定的毫秒（默认100）后绘制；该时间段内重复调用只会触发一次。该函数适合短时间内多次触发绘制的场景               |
| render                | 无                                  | 无       | 立即重新绘制。因绘制操作较”重“，推荐优先考虑 renderLater 方法。                            |
| on                    | eventName:String, handler:Function | 无       | 监听 eventName 事件                                                    |
| off                   | eventName:String, handler:Function | 无       | 注销 eventName 事件                                                    |
| show                  | 无                                  | 无       | 显示图层                                                               |
| hide                  | 无                                  | 无       | 隐藏图层                                                               |
| isHidden              | 无                                  | Boolean | 返回是否处于隐藏状态                                                         |
| zoomToShowSubFeatures | adcode:number,[ center.LngLat ]    | 无       | 缩放地图至某一级别，此时adcode对应的区划刚好展开显示自身的子级；同时移动地图中心到center（默认为区划行政中心）所指位置。 |、
| destroy               | 无                                  | 无       | 销毁图层                                                               |
| forceRender           | 无                                  | 无       | 强制刷新图层，非特殊情况请勿使用                                                   |

###### 事件列表

| 事件名                | 参数                                                              | 描述                  |
|--------------------|-----------------------------------------------------------------|---------------------|
| featureClick       | event, feature                                                  | 鼠标点击feature对应的区域时触发 |
| featureMouseover   | event, feature                                                  | 鼠标移入feature对应的区域时触发 |
| featureMouseout    | event, feature                                                  | 鼠标移出feature对应的区域时触发 |
| clusterMarkerClick | event, record: { adcode:number,feature:Feature,dataItems:Array} | 鼠标点击聚合标注时触发         |

