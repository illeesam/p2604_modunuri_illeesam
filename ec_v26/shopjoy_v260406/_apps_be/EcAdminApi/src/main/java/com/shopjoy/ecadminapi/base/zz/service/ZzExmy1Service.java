package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy1;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzExmy1Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzExmy2Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzExmy3Mapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzExmy1Service {

    private final ZzExmy1Mapper zzExmy1Mapper;
    private final ZzExmy2Mapper zzExmy2Mapper;
    private final ZzExmy3Mapper zzExmy3Mapper;

    /** getById — 조회 */
    public ZzExmy1Dto.Item getById(String exmy1Id) {
        ZzExmy1Dto.Item dto = zzExmy1Mapper.selectById(exmy1Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getList — 조회 (각 항목에 하위 exmy2s / exmy3s 포함) */
    public List<ZzExmy1Dto.Item> getList(ZzExmy1Dto.Request req) {
        List<ZzExmy1Dto.Item> list = zzExmy1Mapper.selectList(req);
        list.forEach(this::fillChildren);
        return list;
    }

    /** getPageData — 조회 (각 항목에 하위 exmy2s / exmy3s 포함) */
    public ZzExmy1Dto.PageResponse getPageData(ZzExmy1Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzExmy1Dto.Item> list = zzExmy1Mapper.selectPageList(req);
        list.forEach(this::fillChildren);
        long total = zzExmy1Mapper.selectPageCount(req);
        ZzExmy1Dto.PageResponse res = new ZzExmy1Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** 하위 계층(exmy2s/exmy3s) 채우기 */
    private void fillChildren(ZzExmy1Dto.Item item) {
        ZzExmy2Dto.Request req2 = new ZzExmy2Dto.Request();
        req2.setExmy1Id(item.getExmy1Id());
        item.setExmy2s(zzExmy2Mapper.selectList(req2));

        ZzExmy3Dto.Request req3 = new ZzExmy3Dto.Request();
        req3.setExmy1Id(item.getExmy1Id());
        item.setExmy3s(zzExmy3Mapper.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzExmy1 create(ZzExmy1 body) {
        if (body.getExmy1Id() == null || body.getExmy1Id().isBlank())
            throw new CmBizException("exmy1Id 는 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        if (zzExmy1Mapper.selectById(body.getExmy1Id()) != null)
            throw new CmBizException("이미 존재하는 데이터입니다: " + body.getExmy1Id() + "::" + CmUtil.svcCallerInfo(this));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        if (zzExmy1Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzExmy1 update(String exmy1Id, ZzExmy1 body) {
        if (zzExmy1Mapper.selectById(exmy1Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "::" + CmUtil.svcCallerInfo(this));
        body.setExmy1Id(exmy1Id);
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        if (zzExmy1Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzExmy1 entity) {
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return zzExmy1Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String exmy1Id) {
        if (zzExmy1Mapper.selectById(exmy1Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzExmy1Mapper.delete(exmy1Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
