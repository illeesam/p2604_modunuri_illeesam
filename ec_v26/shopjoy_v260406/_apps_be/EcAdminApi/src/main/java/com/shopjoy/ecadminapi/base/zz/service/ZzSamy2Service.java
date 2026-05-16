package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy2;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy2Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy3Mapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSamy2Service {

    private final ZzSamy2Mapper zzSamy2Mapper;
    private final ZzSamy3Mapper zzSamy3Mapper;

    /** getById — 조회 */
    public ZzSamy2Dto.Item getById(String samy2Id) {
        ZzSamy2Dto.Item dto = zzSamy2Mapper.selectById(samy2Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + samy2Id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getList — 조회 (각 항목에 하위 samy3s 포함) */
    public List<ZzSamy2Dto.Item> getList(ZzSamy2Dto.Request req) {
        List<ZzSamy2Dto.Item> list = zzSamy2Mapper.selectList(req);
        list.forEach(this::fillChildren);
        return list;
    }

    /** getPageData — 조회 (각 항목에 하위 samy3s 포함) */
    public ZzSamy2Dto.PageResponse getPageData(ZzSamy2Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzSamy2Dto.Item> list = zzSamy2Mapper.selectPageList(req);
        list.forEach(this::fillChildren);
        long total = zzSamy2Mapper.selectPageCount(req);
        ZzSamy2Dto.PageResponse res = new ZzSamy2Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** 하위 계층(samy3s) 채우기 */
    private void fillChildren(ZzSamy2Dto.Item item) {
        ZzSamy3Dto.Request req3 = new ZzSamy3Dto.Request();
        req3.setSamy2Id(item.getSamy2Id());
        item.setSamy3s(zzSamy3Mapper.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzSamy2 create(ZzSamy2 body) {
        body.setSamy2Id(CmUtil.generateId("zz_samy2"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy2Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzSamy2 update(String samy2Id, ZzSamy2 body) {
        if (zzSamy2Mapper.selectById(samy2Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy2Id + "::" + CmUtil.svcCallerInfo(this));
        body.setSamy2Id(samy2Id);
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy2Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzSamy2 entity) {
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSamy2Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String samy2Id) {
        if (zzSamy2Mapper.selectById(samy2Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy2Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzSamy2Mapper.delete(samy2Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
