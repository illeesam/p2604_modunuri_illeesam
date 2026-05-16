package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy2;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzExmy1Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzExmy2Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzExmy3Mapper;
import org.springframework.util.StringUtils;
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
public class ZzExmy2Service {

    private final ZzExmy1Mapper zzExmy1Mapper;
    private final ZzExmy2Mapper zzExmy2Mapper;
    private final ZzExmy3Mapper zzExmy3Mapper;

    /** getById — 조회 (복합 PK) */
    public ZzExmy2Dto.Item getById(String exmy1Id, String exmy2Id) {
        ZzExmy2Dto.Item dto = zzExmy2Mapper.selectById(exmy1Id, exmy2Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "/" + exmy2Id + "::" + CmUtil.svcCallerInfo(this));
        fillRelations(dto);
        return dto;
    }

    /** getList — 조회 (각 항목에 하위 exmy3s 포함) */
    public List<ZzExmy2Dto.Item> getList(ZzExmy2Dto.Request req) {
        List<ZzExmy2Dto.Item> list = zzExmy2Mapper.selectList(req);
        list.forEach(this::fillRelations);
        return list;
    }

    /** getPageData — 조회 (각 항목에 하위 exmy3s 포함) */
    public ZzExmy2Dto.PageResponse getPageData(ZzExmy2Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzExmy2Dto.Item> list = zzExmy2Mapper.selectPageList(req);
        list.forEach(this::fillRelations);
        long total = zzExmy2Mapper.selectPageCount(req);
        ZzExmy2Dto.PageResponse res = new ZzExmy2Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** 상위 계층(exmy1) / 하위 계층(exmy3s) 채우기 */
    private void fillRelations(ZzExmy2Dto.Item item) {
        if (StringUtils.hasText(item.getExmy1Id()))
            item.setExmy1(zzExmy1Mapper.selectById(item.getExmy1Id()));
        ZzExmy3Dto.Request req3 = new ZzExmy3Dto.Request();
        req3.setExmy1Id(item.getExmy1Id());
        req3.setExmy2Id(item.getExmy2Id());
        item.setExmy3s(zzExmy3Mapper.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzExmy2 create(ZzExmy2 body) {
        if (body.getExmy1Id() == null || body.getExmy1Id().isBlank()
                || body.getExmy2Id() == null || body.getExmy2Id().isBlank())
            throw new CmBizException("exmy1Id, exmy2Id 는 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        if (zzExmy2Mapper.selectById(body.getExmy1Id(), body.getExmy2Id()) != null)
            throw new CmBizException("이미 존재하는 데이터입니다: " + body.getExmy1Id() + "/" + body.getExmy2Id() + "::" + CmUtil.svcCallerInfo(this));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        if (zzExmy2Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzExmy2 update(String exmy1Id, String exmy2Id, ZzExmy2 body) {
        if (zzExmy2Mapper.selectById(exmy1Id, exmy2Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "/" + exmy2Id + "::" + CmUtil.svcCallerInfo(this));
        body.setExmy1Id(exmy1Id);
        body.setExmy2Id(exmy2Id);
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        if (zzExmy2Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzExmy2 entity) {
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return zzExmy2Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String exmy1Id, String exmy2Id) {
        if (zzExmy2Mapper.selectById(exmy1Id, exmy2Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "/" + exmy2Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzExmy2Mapper.delete(exmy1Id, exmy2Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
