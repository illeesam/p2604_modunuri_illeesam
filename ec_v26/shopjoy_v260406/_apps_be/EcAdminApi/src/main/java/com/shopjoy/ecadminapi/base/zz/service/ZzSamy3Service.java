package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy3;
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
public class ZzSamy3Service {

    private final ZzSamy3Mapper zzSamy3Mapper;

    /** getById — 조회 */
    public ZzSamy3Dto.Item getById(String samy3Id) {
        ZzSamy3Dto.Item dto = zzSamy3Mapper.selectById(samy3Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + samy3Id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getList — 조회 */
    public List<ZzSamy3Dto.Item> getList(ZzSamy3Dto.Request req) {
        return zzSamy3Mapper.selectList(req);
    }

    /** getPageData — 조회 */
    public ZzSamy3Dto.PageResponse getPageData(ZzSamy3Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzSamy3Dto.Item> list = zzSamy3Mapper.selectPageList(req);
        long total = zzSamy3Mapper.selectPageCount(req);
        ZzSamy3Dto.PageResponse res = new ZzSamy3Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** create — 생성 */
    @Transactional
    public ZzSamy3 create(ZzSamy3 body) {
        body.setSamy3Id(CmUtil.generateId("zz_samy3"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy3Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzSamy3 update(String samy3Id, ZzSamy3 body) {
        if (zzSamy3Mapper.selectById(samy3Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy3Id + "::" + CmUtil.svcCallerInfo(this));
        body.setSamy3Id(samy3Id);
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy3Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzSamy3 entity) {
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSamy3Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String samy3Id) {
        if (zzSamy3Mapper.selectById(samy3Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy3Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzSamy3Mapper.delete(samy3Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
