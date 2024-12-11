import { CatmullRomCurve3, CircleGeometry, Color, Mesh, MeshBasicMaterial, Object3D, Raycaster, TubeGeometry, Vector2, Vector3 } from "three"
import { Canvas } from "../webgl/canvas"
import { MyObject3D } from "../webgl/myObject3D"
import { MouseMgr } from "../core/mouseMgr"
import { Func } from "../core/func"
import { Val } from "../libs/val"
import { Util } from "../libs/util"
import { Tween } from "../core/tween"

export class Visual extends Canvas {

  private _con: Object3D
  private _ray: Raycaster = new Raycaster()
  private _items: Array<ToggleMushi> = []
  private _hoverTestMesh: Array<Mesh> = []

  constructor(opt:any) {
    super(opt)

    this._con = new Object3D()
    this.mainScene.add(this._con)

    const num = Func.val(40, 100)
    for(let i = 0; i < num; i++) {
      const item = new ToggleMushi()
      this._con.add(item)
      this._items.push(item)
      this._hoverTestMesh.push(item.line)
    }

    this._setClickEvent(this.el, () => {
      this._eClick()
    })

    this._resize()
  }

  private _eClick():void {
    this._items.forEach((val) => {
      if(val.isHover) val.setToggle(!val.isActive)
    })
  }

  _update():void {
    super._update()

    

    // マウス判定 
    this._items.forEach((val) => {
      val.isHover = false
    })
    
    const mousePos = new Vector2(MouseMgr.instance.normal.x, MouseMgr.instance.normal.y * -1)
    this._ray.setFromCamera(mousePos, this.cameraOrth)
    const intersects = this._ray.intersectObjects(this._hoverTestMesh)
    const isHover: boolean = intersects.length > 0
    if(isHover) {
      ((intersects[0].object as any).myCurrent as ToggleMushi).isHover = true
    }

    if(isHover) {
      document.body.style.cursor = 'pointer'
    } else {
      document.body.style.cursor = 'default'
    }
    
    if(this.isNowRenderFrame()) {
      this._render()
    }
  }

  _render():void {
    this.renderer.setClearColor(0xffffff, 1)
    this.renderer.render(this.mainScene, this.cameraOrth)
  }

  isNowRenderFrame():boolean {
    return true
  }

  _resize():void {
    super._resize()

    const w = Func.sw()
    const h = Func.sh()

    this.renderSize.width = w
    this.renderSize.height = h

    this._updateOrthCamera(this.cameraOrth, w, h)

    let pixelRatio:number = window.devicePixelRatio || 1
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(w, h)
  }

  
}



export class ToggleMushi extends MyObject3D {

  private _line: Mesh;
  public get line():Mesh { return this._line }

  private _edge:Array<Mesh> = [];
  private _dot: Mesh;
  private _dotPosRate: Val = new Val(0);
  private _btnColor: Color = new Color(0xffffff)
  private _defaultBgColor: Color = new Color(0xcccccc)
  private _activeBgColor: Color = new Color(0x76d672)
  private _lineMat: MeshBasicMaterial
  private _basePos: Vector3 = new Vector3()
  private _oldPos: Vector3 = new Vector3()
  private _oldPosTg: Vector3 = new Vector3()
  private _size: number = 18
  private _speed: Vector2 = new Vector2(Util.random2(0.5, 2), Util.random2(0.5, 2))
  private _interval: number = Util.randomInt(30, 70)
  // private _noise: Vector3 = new Vector3(
  //   Util.range(1.5),
  //   Util.range(1.5),
  //   Util.range(1.5)
  // )

  private _isActive: boolean = false
  public set isActive(v:boolean) { this._isActive = v }
  public get isActive():boolean { return this._isActive }

  private _isHover: boolean = false
  public set isHover(v:boolean) { this._isHover = v }
  public get isHover():boolean { return this._isHover }


  constructor() {
    super()

    // this._isActive = Util.hit(10)
    // if(this._isActive) this._dotPosRate.val = 1

    this._basePos.x = Util.range(Func.sw () * 0.5)
    this._basePos.y = Util.range(Func.sh () * 0.5)
    this._oldPos.copy(this._basePos)
    this._oldPosTg.copy(this._basePos)

    this._lineMat = new MeshBasicMaterial({
      depthTest: false,
      color: this._activeBgColor,
    })

    for(let i = 0; i < 2; i++) {
      const edge = new Mesh(
        new CircleGeometry(0.5, 64),
        this._lineMat
      );
      this.add(edge);
      this._edge.push(edge);
    }

    this._dot = new Mesh(
      new CircleGeometry(0.5, 64),
      new MeshBasicMaterial({
        depthTest: false,
        color: this._btnColor,
      })
    );
    this.add(this._dot);
    this._dot.renderOrder = 2;

    this._line = new Mesh(
      this._makeLineGeo(),
      this._lineMat
    );
    this.add(this._line);

    (this._line as any).myCurrent = this


    this._resize()
  } 


  public setToggle(v:boolean): void {
    this._isActive = v
    Tween.a(this._dotPosRate, {
      val: v ? 1 : 0
    }, 0.75, 0, Tween.ExpoEaseOut)
  }


  // ---------------------------------
  // 更新
  // ---------------------------------
  protected _update(): void {
    super._update()

    const col = this._defaultBgColor.clone().lerp(this._activeBgColor.clone(), this._dotPosRate.val)
    // col.offsetHSL(0, 0, this._isHover ? 0.1 : 0)

    this._lineMat.color = col;

    const speedOffset = 1

    // エリア内を移動
    if(this._c % this._interval == 0) {
      this._oldPosTg.copy(this._basePos)
    } else {
      this._oldPosTg.x += this._speed.x * -0.2 * speedOffset
      this._oldPosTg.y += this._speed.y * -0.2 * speedOffset
    }
    this._oldPos.x += (this._oldPosTg.x - this._oldPos.x) * 0.1
    this._oldPos.y += (this._oldPosTg.y - this._oldPos.y) * 0.1

    this._basePos.x += this._speed.x * speedOffset
    this._basePos.y += this._speed.y * speedOffset

    if(this._basePos.x > Func.sw() * 0.5 || this._basePos.x < Func.sw() * -0.5) {
      this._speed.x = -this._speed.x
    }
    if(this._basePos.y > Func.sh() * 0.5 || this._basePos.y < -Func.sh() * 0.5) {
      this._speed.y = -this._speed.y
    }

    if(Util.hit(100)) {
      this._speed.x = -this._speed.x
    }
    if(Util.hit(100)) {
      this._speed.y = -this._speed.y
    }
    

    this._line.geometry.dispose()
    this._line.geometry = this._makeLineGeo()
  }

  // ---------------------------------
  // リサイズ
  // ---------------------------------
  protected _resize(): void {
    super._resize()
  }

  // ---------------------------------
  private _makeLineGeo(): TubeGeometry {
    const arr: Array<Vector3> = [];

    arr.push(this._oldPos)

    // _oldPosと_basePosの中間点を追加
    const midPos = this._oldPos.clone().lerp(this._basePos, 0.25)
    arr.push(midPos)

    const rad = Util.radian(this._c * 5)
    const xr = 5
    const yr = 10

    // ちょっと動かす
    midPos.x += Math.sin(rad) * xr
    midPos.y += Math.cos(rad) * yr

    const midPos2 = this._oldPos.clone().lerp(this._basePos, 0.75)
    arr.push(midPos2)

    // ちょっと動かす
    midPos2.x += Math.sin(rad * -1) * xr
    midPos2.y += Math.cos(rad * -1) * yr

    arr.push(this._basePos)
    arr.reverse()

    const width = this._size;

    const edgeSize = width * 1.75;
    this._edge[0].scale.set(edgeSize, edgeSize, 1);
    this._edge[1].scale.set(edgeSize, edgeSize, 1);

    this._edge[0].position.x = arr[0].x;
    this._edge[0].position.y = arr[0].y;

    this._edge[1].position.x = arr[arr.length - 1].x;
    this._edge[1].position.y = arr[arr.length - 1].y;

    const btnSize = width * 1.5;
    this._dot.scale.set(btnSize, btnSize, 1);

    const sampleClosedSpline = new CatmullRomCurve3(arr, false);
    const tube = new TubeGeometry(sampleClosedSpline, 20, width, 3, false);

    const dotPos = sampleClosedSpline.getPointAt(this._dotPosRate.val);
    this._dot.position.copy(dotPos);

    return tube;
  }
}