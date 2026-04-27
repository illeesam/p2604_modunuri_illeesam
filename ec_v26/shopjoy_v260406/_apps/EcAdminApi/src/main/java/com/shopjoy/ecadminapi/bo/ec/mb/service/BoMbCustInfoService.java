package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoMbCustInfoService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final MbMemberMapper mapper;
    private final MbMemberRepository repository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<MbMemberDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public MbMemberDto getById(String id) {
        MbMemberDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public MbMember create(MbMember body) {
        body.setMemberId("MB" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMember saved = repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public MbMemberDto update(String id, MbMember body) {
        MbMember entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setSiteId(body.getSiteId());
        entity.setLoginId(body.getLoginId());
        entity.setLoginPwdHash(body.getLoginPwdHash());
        entity.setMemberNm(body.getMemberNm());
        entity.setMemberPhone(body.getMemberPhone());
        entity.setMemberGender(body.getMemberGender());
        entity.setBirthDate(body.getBirthDate());
        entity.setGradeCd(body.getGradeCd());
        entity.setMemberStatusCd(body.getMemberStatusCd());
        entity.setMemberStatusCdBefore(body.getMemberStatusCdBefore());
        entity.setJoinDate(body.getJoinDate());
        entity.setLastLogin(body.getLastLogin());
        entity.setOrderCount(body.getOrderCount());
        entity.setTotalPurchaseAmt(body.getTotalPurchaseAmt());
        entity.setCacheBalanceAmt(body.getCacheBalanceAmt());
        entity.setMemberZipCode(body.getMemberZipCode());
        entity.setMemberAddr(body.getMemberAddr());
        entity.setMemberAddrDetail(body.getMemberAddrDetail());
        entity.setMemberMemo(body.getMemberMemo());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        repository.deleteById(id);
        em.flush();
    }
}
