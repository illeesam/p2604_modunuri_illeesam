package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExmy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExmy3;
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
public class ZzExmy3Service {

    private final ZzExmy1Mapper zzExmy1Mapper;
    private final ZzExmy2Mapper zzExmy2Mapper;
    private final ZzExmy3Mapper zzExmy3Mapper;

    /** getById — 조회 (복합 PK, 상위 exmy1 / exmy2 포함) */
    public ZzExmy3Dto.Item getById(String exmy1Id, String exmy2Id, String exmy3Id) {
        ZzExmy3Dto.Item dto = zzExmy3Mapper.selectById(exmy1Id, exmy2Id, exmy3Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "/" + exmy2Id + "/" + exmy3Id + "::" + CmUtil.svcCallerInfo(this));
        fillRelations(dto);
        return dto;
    }

    /** getList — 조회 (각 항목에 상위 exmy1 / exmy2 포함) */
    public List<ZzExmy3Dto.Item> getList(ZzExmy3Dto.Request req) {
        List<ZzExmy3Dto.Item> list = zzExmy3Mapper.selectList(req);
        list.forEach(this::fillRelations);
        return list;
    }

    /** getPageData — 조회 (각 항목에 상위 exmy1 / exmy2 포함) */
    public ZzExmy3Dto.PageResponse getPageData(ZzExmy3Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzExmy3Dto.Item> list = zzExmy3Mapper.selectPageList(req);
        list.forEach(this::fillRelations);
        long total = zzExmy3Mapper.selectPageCount(req);
        ZzExmy3Dto.PageResponse res = new ZzExmy3Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** 상위 계층(exmy1 / exmy2) 채우기 */
    private void fillRelations(ZzExmy3Dto.Item item) {
        if (StringUtils.hasText(item.getExmy1Id()))
            item.setExmy1(zzExmy1Mapper.selectById(item.getExmy1Id()));
        if (StringUtils.hasText(item.getExmy1Id()) && StringUtils.hasText(item.getExmy2Id()))
            item.setExmy2(zzExmy2Mapper.selectById(item.getExmy1Id(), item.getExmy2Id()));
    }

    /** create — 생성 */
    @Transactional
    public ZzExmy3 create(ZzExmy3 body) {
        if (body.getExmy1Id() == null || body.getExmy1Id().isBlank()
                || body.getExmy2Id() == null || body.getExmy2Id().isBlank()
                || body.getExmy3Id() == null || body.getExmy3Id().isBlank())
            throw new CmBizException("exmy1Id, exmy2Id, exmy3Id 는 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        if (zzExmy3Mapper.selectById(body.getExmy1Id(), body.getExmy2Id(), body.getExmy3Id()) != null)
            throw new CmBizException("이미 존재하는 데이터입니다: " + body.getExmy1Id() + "/" + body.getExmy2Id() + "/" + body.getExmy3Id() + "::" + CmUtil.svcCallerInfo(this));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        if (zzExmy3Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzExmy3 update(String exmy1Id, String exmy2Id, String exmy3Id, ZzExmy3 body) {
        if (zzExmy3Mapper.selectById(exmy1Id, exmy2Id, exmy3Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "/" + exmy2Id + "/" + exmy3Id + "::" + CmUtil.svcCallerInfo(this));
        body.setExmy1Id(exmy1Id);
        body.setExmy2Id(exmy2Id);
        body.setExmy3Id(exmy3Id);
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        if (zzExmy3Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzExmy3 entity) {
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return zzExmy3Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String exmy1Id, String exmy2Id, String exmy3Id) {
        if (zzExmy3Mapper.selectById(exmy1Id, exmy2Id, exmy3Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + exmy1Id + "/" + exmy2Id + "/" + exmy3Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzExmy3Mapper.delete(exmy1Id, exmy2Id, exmy3Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
